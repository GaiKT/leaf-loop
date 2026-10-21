"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getCurrentGrower } from "@/lib/dal";
import { fromDbDate, todayInBangkok, toDbDate } from "@/lib/dates";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { lockBatch, lockTables, usedSlots } from "@/lib/placements-db";
import { TransplantSchema } from "@/lib/schemas";

// Thrown inside the transaction to roll it back and hand a message to the form.
class Rejected extends Error {
  constructor(public state: NonNullable<FormState>) {
    super("rejected");
  }
}

export async function completeTransplant(
  batchId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");

  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }

  const parsed = TransplantSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { available, transplantDate, leftover } = parsed.data;

  if (transplantDate > todayInBangkok()) {
    return { errors: { transplantDate: ["วันที่ย้ายปลูกต้องไม่เกินวันนี้"] }, values };
  }

  const tables = await db.table.findMany({ where: { farmId: grower.farmId } });
  const place = new Map<string, number>();
  const errors: Record<string, string[]> = {};
  for (const table of tables) {
    const raw = (values[`place_${table.id}`] ?? "").trim();
    if (raw === "") continue;
    if (!/^\d+$/.test(raw)) {
      errors[`place_${table.id}`] = ["กรอกจำนวนเป็นจำนวนเต็ม"];
    } else if (Number(raw) > 0) {
      place.set(table.id, Number(raw));
    }
  }
  if (Object.keys(errors).length > 0) return { errors, values };

  const placed = [...place.values()].reduce((sum, n) => sum + n, 0);
  if (placed < 1) {
    return { message: "ระบุจำนวนที่ย้ายลงโต๊ะอย่างน้อย 1 ต้น", values };
  }
  if (placed > available) {
    return { message: "ย้ายเกินจำนวนต้นที่มี", values };
  }

  try {
    await db.$transaction(async (tx) => {
      await lockBatch(tx, batchId);
      await lockTables(tx, [...place.keys()]);

      const batch = await tx.batch.findFirst({
        where: { id: batchId, status: "ACTIVE", variety: { farmId: grower.farmId } },
      });
      if (!batch || batch.nurseryRemaining === 0) {
        throw new Rejected({ message: "ไม่พบรุ่นนี้ หรือย้ายปลูกครบแล้ว", values });
      }
      const max = batch.nurseryRemaining ?? batch.sownCount;
      if (available > max) {
        throw new Rejected({
          errors: { available: [`ย้ายได้ไม่เกิน ${max} ต้น`] },
          values,
        });
      }
      if (transplantDate < fromDbDate(batch.sowDate)) {
        throw new Rejected({
          errors: { transplantDate: ["วันที่ย้ายปลูกต้องไม่ก่อนวันที่เพาะ"] },
          values,
        });
      }

      const used = await usedSlots(tx, [...place.keys()]);
      const full: Record<string, string[]> = {};
      for (const [tableId, plants] of place) {
        const table = tables.find((t) => t.id === tableId)!;
        const free = table.slotCount - (used.get(tableId) ?? 0);
        if (plants > free) {
          full[`place_${tableId}`] = [`${table.name} มีหลุมว่างเหลือ ${Math.max(free, 0)} หลุม`];
        }
      }
      if (Object.keys(full).length > 0) throw new Rejected({ errors: full, values });

      for (const [tableId, plants] of place) {
        const table = tables.find((t) => t.id === tableId)!;
        await tx.placement.create({
          data: {
            batchId,
            tableId,
            tableName: table.name,
            transplantDate: toDbDate(transplantDate),
            plantCount: plants,
          },
        });
      }
      const left = available - placed;
      await tx.batch.update({
        where: { id: batchId },
        data: {
          // `available` is the seedlings in hand. What is not moved now is either kept for another
          // Transplant or dropped from the Batch. Seedlings beyond `available` (lost since the sow)
          // are not tracked.
          nurseryRemaining: leftover === "keep" ? left : 0,
        },
      });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/");
}
