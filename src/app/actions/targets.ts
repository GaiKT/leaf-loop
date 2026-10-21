"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { getCurrentGrower } from "@/lib/dal";
import { mondayOf, todayInBangkok, toDbDate } from "@/lib/dates";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { TargetSchema, WeekSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

async function ownedVariety(varietyId: string) {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");
  const variety = await db.variety.findFirst({ where: { id: varietyId, farmId: grower.farmId } });
  return variety;
}

// Plans, Today and the per-Variety page all change when a target or a skipped week does.
function refreshPlan() {
  revalidatePath("/", "layout");
}

const WEEK_IN_PAST = "ไม่สามารถแก้ไขสัปดาห์ที่ผ่านมาแล้วได้";

export async function saveTarget(
  varietyId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const variety = await ownedVariety(varietyId);
  if (!variety) return { message: "ไม่พบพันธุ์นี้" };

  const raw = {
    kgPerWeek: String(formData.get("kgPerWeek") ?? ""),
    effectiveWeek: String(formData.get("effectiveWeek") ?? ""),
  };
  const parsed = TargetSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: raw };
  }
  // A target can only be set from this week onward, so past weeks are never rewritten.
  if (parsed.data.effectiveWeek < mondayOf(todayInBangkok())) {
    return { errors: { effectiveWeek: [WEEK_IN_PAST] }, values: raw };
  }

  const effectiveWeek = toDbDate(parsed.data.effectiveWeek);
  await db.harvestTarget.upsert({
    where: { varietyId_effectiveWeek: { varietyId, effectiveWeek } },
    create: { varietyId, effectiveWeek, kgPerWeek: parsed.data.kgPerWeek },
    update: { kgPerWeek: parsed.data.kgPerWeek },
  });

  refreshPlan();
  return { success: true, message: "บันทึกเป้าแล้ว" };
}

export async function skipWeek(varietyId: string, formData: FormData) {
  const variety = await ownedVariety(varietyId);
  if (!variety) return;

  const parsed = WeekSchema.safeParse({ week: String(formData.get("week") ?? "") });
  if (!parsed.success || parsed.data.week < mondayOf(todayInBangkok())) return;

  const week = toDbDate(parsed.data.week);
  await db.skippedWeek.upsert({
    where: { varietyId_week: { varietyId, week } },
    create: { varietyId, week },
    update: {},
  });
  refreshPlan();
}

export async function unskipWeek(varietyId: string, week: string) {
  const variety = await ownedVariety(varietyId);
  if (!variety) return;

  const parsed = WeekSchema.safeParse({ week });
  if (!parsed.success) return;

  await db.skippedWeek.deleteMany({ where: { varietyId, week: toDbDate(parsed.data.week) } });
  refreshPlan();
}
