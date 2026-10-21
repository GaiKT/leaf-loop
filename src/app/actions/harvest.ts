"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getCurrentGrower } from "@/lib/dal";
import { fromDbDate, todayInBangkok, toDbDate } from "@/lib/dates";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { lockBatch } from "@/lib/placements-db";
import { HarvestSchema } from "@/lib/schemas";

class Rejected extends Error {
  constructor(public state: NonNullable<FormState>) {
    super("rejected");
  }
}

export async function completeHarvest(
  placementId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");

  const values = {
    harvestKg: String(formData.get("harvestKg") ?? ""),
    harvestDate: String(formData.get("harvestDate") ?? ""),
  };
  const parsed = HarvestSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (parsed.data.harvestDate > todayInBangkok()) {
    return { errors: { harvestDate: ["วันที่เก็บเกี่ยวต้องไม่เกินวันนี้"] }, values };
  }

  const owned = await db.placement.findFirst({
    where: { id: placementId, batch: { variety: { farmId: grower.farmId } } },
    select: { batchId: true },
  });
  if (!owned) return { message: "ไม่พบรายการเก็บเกี่ยวนี้", values };

  try {
    await db.$transaction(async (tx) => {
      await lockBatch(tx, owned.batchId);

      const placement = await tx.placement.findUnique({ where: { id: placementId } });
      if (!placement || placement.harvestDate !== null) {
        throw new Rejected({ message: "เก็บเกี่ยวรายการนี้ไปแล้ว", values });
      }
      if (parsed.data.harvestDate < fromDbDate(placement.transplantDate)) {
        throw new Rejected({
          errors: { harvestDate: ["วันที่เก็บเกี่ยวต้องไม่ก่อนวันที่ย้ายปลูก"] },
          values,
        });
      }

      await tx.placement.update({
        where: { id: placementId },
        data: { harvestDate: toDbDate(parsed.data.harvestDate), harvestKg: parsed.data.harvestKg },
      });

      // A Batch is closed once every Placement is harvested and no seedlings are left to transplant.
      const batch = await tx.batch.findUniqueOrThrow({ where: { id: placement.batchId } });
      const stillGrowing = await tx.placement.count({
        where: { batchId: batch.id, harvestDate: null },
      });
      if (stillGrowing === 0 && batch.nurseryRemaining === 0) {
        await tx.batch.update({ where: { id: batch.id }, data: { status: "CLOSED" } });
      }
    });
  } catch (error) {
    if (error instanceof Rejected) return error.state;
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/");
}
