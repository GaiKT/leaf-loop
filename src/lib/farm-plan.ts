import { fromDbDate, todayInBangkok } from "@/lib/dates";
import { db } from "@/lib/db";
import { buildSchedule, type ScheduleInput } from "@/lib/schedule";
import { slotUsage } from "@/lib/slots";

/** Loads everything the schedule engine needs for one Farm and runs it. Nothing is cached or stored. */
export async function loadFarmPlan(farm: { id: string; harvestWeekday: number }) {
  const today = todayInBangkok();

  const [varieties, targets, skippedWeeks, batches, tables] = await Promise.all([
    db.variety.findMany({ where: { farmId: farm.id }, orderBy: { name: "asc" } }),
    db.harvestTarget.findMany({
      where: { variety: { farmId: farm.id } },
      orderBy: { effectiveWeek: "asc" },
    }),
    db.skippedWeek.findMany({ where: { variety: { farmId: farm.id } } }),
    db.batch.findMany({
      where: { variety: { farmId: farm.id } },
      include: { placements: { orderBy: { createdAt: "asc" } } },
    }),
    db.table.findMany({ where: { farmId: farm.id }, orderBy: { name: "asc" } }),
  ]);

  const input: ScheduleInput = {
    harvestWeekday: farm.harvestWeekday,
    today,
    slotCapacity: tables.reduce((sum, t) => sum + t.slotCount, 0),
    varieties: varieties.map((v) => ({
      id: v.id,
      name: v.name,
      germinationDays: v.germinationDays,
      nurseryDays: v.nurseryDays,
      growOutDays: v.growOutDays,
      survivalPercent: v.survivalPercent,
      gramsPerPlant: v.gramsPerPlant,
    })),
    targets: targets.map((t) => ({
      varietyId: t.varietyId,
      effectiveWeek: fromDbDate(t.effectiveWeek),
      kgPerWeek: Number(t.kgPerWeek),
    })),
    skippedWeeks: skippedWeeks.map((s) => ({ varietyId: s.varietyId, week: fromDbDate(s.week) })),
    batches: batches.map((b) => ({
      id: b.id,
      varietyId: b.varietyId,
      harvestWeek: fromDbDate(b.harvestWeek),
      sowDate: fromDbDate(b.sowDate),
      sownCount: b.sownCount,
      status: b.status,
      nurseryRemaining: b.nurseryRemaining,
      placements: b.placements.map((p) => ({
        id: p.id,
        tableId: p.tableId,
        plantCount: p.plantCount,
        transplantDate: fromDbDate(p.transplantDate),
        harvestDate: p.harvestDate ? fromDbDate(p.harvestDate) : null,
        harvestKg: p.harvestKg === null ? null : Number(p.harvestKg),
      })),
      germinationDays: b.germinationDays,
      nurseryDays: b.nurseryDays,
      growOutDays: b.growOutDays,
      survivalPercent: b.survivalPercent,
      gramsPerPlant: b.gramsPerPlant,
    })),
  };

  const tableInputs = tables.map((t) => ({ id: t.id, name: t.name, slotCount: t.slotCount }));
  const placements = input.batches.flatMap((b) => b.placements);
  // Name of the Table each Placement went to, kept even if the Table has since been removed.
  const placementTable = new Map(batches.flatMap((b) => b.placements.map((p) => [p.id, p.tableName] as const)));

  return {
    today,
    input,
    schedule: buildSchedule(input),
    tables: tableInputs,
    usage: slotUsage(tableInputs, placements),
    placementTable,
  };
}
