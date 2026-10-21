"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getCurrentGrower } from "@/lib/dal";
import { fromDbDate, todayInBangkok, toDbDate } from "@/lib/dates";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { lockBatch, lockTables, usedSlots } from "@/lib/placements-db";
import { HarvestSchema, PlacementSchema, SowSchema } from "@/lib/schemas";

// Thrown inside a transaction to roll it back and hand a message to the form.
class Rejected extends Error {
  constructor(public state: NonNullable<FormState>) {
    super("rejected");
  }
}

const SAVED: FormState = { success: true, message: "บันทึกแล้ว" };

async function requireGrower() {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");
  return grower;
}

function refresh() {
  revalidatePath("/", "layout");
}

function valuesOf(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Corrects when a Batch was sown and how many seedlings. */
export async function editSow(batchId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const grower = await requireGrower();
  const values = valuesOf(formData);

  const parsed = SowSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const { sownCount, sowDate } = parsed.data;
  if (sowDate > todayInBangkok()) {
    return { errors: { sowDate: ["วันที่เพาะต้องไม่เกินวันนี้"] }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      await lockBatch(tx, batchId);
      const batch = await tx.batch.findFirst({
        where: { id: batchId, variety: { farmId: grower.farmId } },
        include: { placements: true },
      });
      if (!batch) throw new Rejected({ message: "ไม่พบรุ่นนี้", values });

      const accounted =
        batch.placements.reduce((sum, p) => sum + p.plantCount, 0) + (batch.nurseryRemaining ?? 0);
      if (sownCount < accounted) {
        throw new Rejected({
          errors: { sownCount: [`ต้องไม่น้อยกว่าจำนวนที่ย้ายปลูกและที่เหลือในอนุบาลรวมกัน (${accounted} ต้น)`] },
          values,
        });
      }
      const firstTransplant = batch.placements
        .map((p) => fromDbDate(p.transplantDate))
        .sort()[0];
      if (firstTransplant && sowDate > firstTransplant) {
        throw new Rejected({
          errors: { sowDate: ["วันที่เพาะต้องไม่หลังวันที่ย้ายปลูก"] },
          values,
        });
      }

      await tx.batch.update({
        where: { id: batchId },
        data: { sownCount, sowDate: toDbDate(sowDate) },
      });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }

  refresh();
  return SAVED;
}

/** Corrects a Placement: its Table, how many plants and when, and the harvest if there is one. */
export async function editPlacement(
  placementId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const grower = await requireGrower();
  const values = valuesOf(formData);
  const today = todayInBangkok();

  const parsed = PlacementSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const { tableId, plantCount, transplantDate } = parsed.data;
  if (transplantDate > today) {
    return { errors: { transplantDate: ["วันที่ย้ายปลูกต้องไม่เกินวันนี้"] }, values };
  }

  // A harvest is corrected together with the Placement it belongs to.
  const hasHarvest = "harvestKg" in values;
  const harvest = hasHarvest ? HarvestSchema.safeParse(values) : null;
  if (harvest && !harvest.success) {
    return { errors: z.flattenError(harvest.error).fieldErrors, values };
  }
  const harvestData = harvest?.success ? harvest.data : null;
  if (harvestData && harvestData.harvestDate > today) {
    return { errors: { harvestDate: ["วันที่เก็บเกี่ยวต้องไม่เกินวันนี้"] }, values };
  }
  if (harvestData && harvestData.harvestDate < transplantDate) {
    return { errors: { harvestDate: ["วันที่เก็บเกี่ยวต้องไม่ก่อนวันที่ย้ายปลูก"] }, values };
  }

  const owned = await db.placement.findFirst({
    where: { id: placementId, batch: { variety: { farmId: grower.farmId } } },
    select: { batchId: true },
  });
  if (!owned) return { message: "ไม่พบรายการนี้", values };

  try {
    await db.$transaction(async (tx) => {
      await lockBatch(tx, owned.batchId);
      await lockTables(tx, [tableId]);

      const placement = await tx.placement.findUnique({ where: { id: placementId } });
      const batch = await tx.batch.findUniqueOrThrow({
        where: { id: owned.batchId },
        include: { placements: true },
      });
      const table = await tx.table.findFirst({ where: { id: tableId, farmId: grower.farmId } });
      if (!placement) throw new Rejected({ message: "ไม่พบรายการนี้", values });
      if (!table) throw new Rejected({ errors: { tableId: ["ไม่พบโต๊ะนี้"] }, values });

      const harvested = placement.harvestDate !== null;
      if (harvested !== (harvestData !== null)) {
        throw new Rejected({ message: "สถานะการเก็บเกี่ยวเปลี่ยนไป เปิดหน้านี้ใหม่", values });
      }
      if (transplantDate < fromDbDate(batch.sowDate)) {
        throw new Rejected({
          errors: { transplantDate: ["วันที่ย้ายปลูกต้องไม่ก่อนวันที่เพาะ"] },
          values,
        });
      }

      const others = batch.placements
        .filter((p) => p.id !== placementId)
        .reduce((sum, p) => sum + p.plantCount, 0);
      if (others + plantCount + (batch.nurseryRemaining ?? 0) > batch.sownCount) {
        throw new Rejected({
          errors: { plantCount: [`รวมกับส่วนอื่นของรุ่นนี้แล้วมากกว่าจำนวนที่เพาะ (${batch.sownCount} ต้น)`] },
          values,
        });
      }

      // A Placement still standing on a Table must fit there. A harvested one holds no Slots.
      if (!harvested) {
        const used = await usedSlots(tx, [tableId], placementId);
        const free = table.slotCount - (used.get(tableId) ?? 0);
        if (plantCount > free) {
          throw new Rejected({
            errors: { plantCount: [`${table.name} มีหลุมว่างเหลือ ${Math.max(free, 0)} หลุม`] },
            values,
          });
        }
      }

      await tx.placement.update({
        where: { id: placementId },
        data: {
          tableId,
          tableName: table.name,
          plantCount,
          transplantDate: toDbDate(transplantDate),
          ...(harvestData
            ? { harvestDate: toDbDate(harvestData.harvestDate), harvestKg: harvestData.harvestKg }
            : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }

  refresh();
  return SAVED;
}

/** Undoes a harvest: the Placement stands on its Table again, so its Slots are taken again. */
export async function undoHarvest(placementId: string): Promise<FormState> {
  const grower = await requireGrower();

  const owned = await db.placement.findFirst({
    where: { id: placementId, batch: { variety: { farmId: grower.farmId } } },
    select: { batchId: true, tableId: true },
  });
  if (!owned) return { message: "ไม่พบรายการนี้" };
  if (!owned.tableId) {
    return { message: "โต๊ะนี้ถูกลบไปแล้ว จึงยกเลิกการเก็บเกี่ยวไม่ได้" };
  }

  try {
    await db.$transaction(async (tx) => {
      await lockBatch(tx, owned.batchId);
      await lockTables(tx, [owned.tableId!]);

      const placement = await tx.placement.findUnique({ where: { id: placementId } });
      const table = await tx.table.findUnique({ where: { id: owned.tableId! } });
      if (!placement || placement.harvestDate === null) {
        throw new Rejected({ message: "รายการนี้ยังไม่ได้เก็บเกี่ยว" });
      }
      if (!table) throw new Rejected({ message: "โต๊ะนี้ถูกลบไปแล้ว จึงยกเลิกการเก็บเกี่ยวไม่ได้" });

      const used = await usedSlots(tx, [table.id]);
      const free = table.slotCount - (used.get(table.id) ?? 0);
      if (placement.plantCount > free) {
        throw new Rejected({
          message: `${table.name} มีหลุมว่างเหลือ ${Math.max(free, 0)} หลุม ไม่พอสำหรับ ${placement.plantCount} ต้น`,
        });
      }

      await tx.placement.update({
        where: { id: placementId },
        data: { harvestDate: null, harvestKg: null },
      });
      // A Closed Batch with a Placement growing again is Active again.
      await tx.batch.update({ where: { id: placement.batchId }, data: { status: "ACTIVE" } });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }

  refresh();
  return { success: true, message: "ยกเลิกการเก็บเกี่ยวแล้ว" };
}
