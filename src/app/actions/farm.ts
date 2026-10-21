"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentGrower } from "@/lib/dal";
import type { FormState } from "@/lib/form-state";
import { lockTables, usedSlots } from "@/lib/placements-db";
import { HarvestDaySchema, TableSchema, VarietySchema } from "@/lib/schemas";

// Thrown inside a transaction to roll it back and hand a message to the form.
class Rejected extends Error {
  constructor(public state: NonNullable<FormState>) {
    super("rejected");
  }
}

async function requireGrower() {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");
  return grower;
}

function formValues(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function updateHarvestDay(_state: FormState, formData: FormData): Promise<FormState> {
  const grower = await requireGrower();
  const parsed = HarvestDaySchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  await db.farm.update({
    where: { id: grower.farmId },
    data: { harvestWeekday: parsed.data.harvestWeekday },
  });
  return { success: true, message: "บันทึกวันเก็บเกี่ยวแล้ว" };
}

export async function createTable(_state: FormState, formData: FormData): Promise<FormState> {
  const grower = await requireGrower();
  const values = formValues(formData);
  const parsed = TableSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    await db.table.create({ data: { farmId: grower.farmId, ...parsed.data } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { name: ["มีโต๊ะชื่อนี้อยู่แล้ว"] }, values };
    }
    throw error;
  }
  redirect("/settings/tables");
}

export async function updateTable(
  id: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const grower = await requireGrower();
  const values = formValues(formData);
  const parsed = TableSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    await db.$transaction(async (tx) => {
      // Locked so a Transplant saved at the same moment cannot slip in between the check and the change.
      await lockTables(tx, [id]);
      const table = await tx.table.findFirst({ where: { id, farmId: grower.farmId } });
      if (!table) throw new Rejected({ message: "ไม่พบโต๊ะนี้", values });

      const used = (await usedSlots(tx, [id])).get(id) ?? 0;
      if (parsed.data.slotCount < used) {
        throw new Rejected({
          errors: {
            slotCount: [`ลดเหลือ ${parsed.data.slotCount} หลุมไม่ได้ เพราะตอนนี้มีต้นผักอยู่ ${used} หลุม`],
          },
          values,
        });
      }

      await tx.table.update({ where: { id }, data: parsed.data });
      // Placements remember the Table's name for when the Table is later removed; keep it current.
      await tx.placement.updateMany({ where: { tableId: id }, data: { tableName: parsed.data.name } });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    if (isUniqueViolation(error)) {
      return { errors: { name: ["มีโต๊ะชื่อนี้อยู่แล้ว"] }, values };
    }
    throw error;
  }
  redirect("/settings/tables");
}

/** Removes a Table that has nothing growing on it. Its past Placements keep their history. */
// The second argument is the previous form state, which `useActionState` always passes and this ignores.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteTable(id: string, _state: FormState): Promise<FormState> {
  const grower = await requireGrower();

  try {
    await db.$transaction(async (tx) => {
      await lockTables(tx, [id]);
      const table = await tx.table.findFirst({ where: { id, farmId: grower.farmId } });
      if (!table) throw new Rejected({ message: "ไม่พบโต๊ะนี้" });

      const used = (await usedSlots(tx, [id])).get(id) ?? 0;
      if (used > 0) {
        throw new Rejected({
          message: `ลบโต๊ะนี้ไม่ได้ เพราะยังมีต้นผักอยู่ ${used} หลุม เก็บเกี่ยวหรือย้ายออกก่อน`,
        });
      }
      await tx.table.delete({ where: { id } });
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }
  redirect("/settings/tables");
}

export async function createVariety(_state: FormState, formData: FormData): Promise<FormState> {
  const grower = await requireGrower();
  const values = formValues(formData);
  const parsed = VarietySchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    await db.variety.create({ data: { farmId: grower.farmId, ...parsed.data } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { name: ["มีพันธุ์ชื่อนี้อยู่แล้ว"] }, values };
    }
    throw error;
  }
  redirect("/settings/varieties");
}

export async function updateVariety(
  id: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const grower = await requireGrower();
  const values = formValues(formData);
  const parsed = VarietySchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    const { count } = await db.variety.updateMany({
      where: { id, farmId: grower.farmId },
      data: parsed.data,
    });
    if (count === 0) return { message: "ไม่พบพันธุ์นี้", values };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { name: ["มีพันธุ์ชื่อนี้อยู่แล้ว"] }, values };
    }
    throw error;
  }
  redirect("/settings/varieties");
}
