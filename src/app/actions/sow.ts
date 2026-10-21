"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentGrower } from "@/lib/dal";
import { todayInBangkok, toDbDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { loadFarmPlan } from "@/lib/farm-plan";
import type { FormState } from "@/lib/form-state";
import { SowSchema, WeekSchema } from "@/lib/schemas";

const NOT_PLANNED = "สัปดาห์นี้ไม่มีรายการเพาะที่ต้องทำ อาจเพาะหรือข้ามไปแล้ว";

// Only a week the schedule currently plans can be sown or skipped, so the client cannot invent one.
async function plannedWeek(varietyId: string, harvestWeek: string) {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");

  const week = WeekSchema.safeParse({ week: harvestWeek });
  if (!week.success) return null;

  const variety = await db.variety.findFirst({ where: { id: varietyId, farmId: grower.farmId } });
  if (!variety) return null;

  const { schedule } = await loadFarmPlan(grower.farm);
  const planned = schedule.plannedBatches.some(
    (b) => b.varietyId === varietyId && b.harvestWeek === week.data.week,
  );
  return planned ? { variety, harvestWeek: week.data.week } : null;
}

export async function completeSow(
  varietyId: string,
  harvestWeek: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    sownCount: String(formData.get("sownCount") ?? ""),
    sowDate: String(formData.get("sowDate") ?? ""),
  };
  const parsed = SowSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (parsed.data.sowDate > todayInBangkok()) {
    return { errors: { sowDate: ["วันที่เพาะต้องไม่เกินวันนี้"] }, values };
  }

  const target = await plannedWeek(varietyId, harvestWeek);
  if (!target) return { message: NOT_PLANNED, values };
  const { variety } = target;

  try {
    await db.batch.create({
      data: {
        varietyId,
        harvestWeek: toDbDate(target.harvestWeek),
        sowDate: toDbDate(parsed.data.sowDate),
        sownCount: parsed.data.sownCount,
        // Copied now so editing the Variety later cannot move a crop that is already growing.
        germinationDays: variety.germinationDays,
        nurseryDays: variety.nurseryDays,
        growOutDays: variety.growOutDays,
        survivalPercent: variety.survivalPercent,
        gramsPerPlant: variety.gramsPerPlant,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { message: "สัปดาห์เก็บเกี่ยวนี้มีรุ่นที่เพาะแล้ว", values };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Skipping a Sow Task is skipping its week; it can be undone from the Variety's target settings. */
export async function skipSow(varietyId: string, harvestWeek: string) {
  const target = await plannedWeek(varietyId, harvestWeek);
  if (target) {
    const week = toDbDate(target.harvestWeek);
    await db.skippedWeek.upsert({
      where: { varietyId_week: { varietyId, week } },
      create: { varietyId, week },
      update: {},
    });
  }
  revalidatePath("/", "layout");
  redirect("/");
}
