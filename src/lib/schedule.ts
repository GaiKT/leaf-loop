import { addDays, harvestDateForWeek, mondayOf, type IsoDate } from "./dates";

export type VarietyInput = {
  id: string;
  name: string;
  germinationDays: number;
  nurseryDays: number;
  growOutDays: number;
  survivalPercent: number;
  gramsPerPlant: number;
};

/** From `effectiveWeek` (a Monday) onward, the Variety is planned for `kgPerWeek`. 0 stops it. */
export type TargetInput = { varietyId: string; effectiveWeek: IsoDate; kgPerWeek: number };

export type SkippedWeekInput = { varietyId: string; week: IsoDate };

/** Part of a Batch transplanted onto one Table. It stands there until it is harvested. */
export type PlacementInput = {
  id: string;
  /** null once its Table has been removed. */
  tableId: string | null;
  plantCount: number;
  transplantDate: IsoDate;
  harvestDate: IsoDate | null;
  harvestKg: number | null;
};

/**
 * A Batch the grower has actually sown. The Variety's values are copied onto it at Sow, so editing the
 * Variety later does not move the dates of a crop that is already growing.
 */
export type BatchInput = {
  id: string;
  varietyId: string;
  /** The Monday of the week this Batch was planned to be harvested in. */
  harvestWeek: IsoDate;
  sowDate: IsoDate;
  sownCount: number;
  status: "ACTIVE" | "CLOSED";
  /**
   * Seedlings still in the nursery after some were transplanted and the grower chose to keep the rest.
   * null means nothing has been transplanted yet; 0 means no seedlings are left to move.
   */
  nurseryRemaining: number | null;
  placements: PlacementInput[];
  germinationDays: number;
  nurseryDays: number;
  growOutDays: number;
  survivalPercent: number;
  gramsPerPlant: number;
};

export type ScheduleInput = {
  /** 0 = Sunday ... 6 = Saturday. */
  harvestWeekday: number;
  varieties: VarietyInput[];
  targets: TargetInput[];
  skippedWeeks: SkippedWeekInput[];
  /** Active and Closed Batches. Each one takes the place of the Planned Batch for its Variety and week. */
  batches: BatchInput[];
  /** Total Slots across all Tables (Farm Capacity). */
  slotCapacity: number;
  today: IsoDate;
  /** How far ahead to plan. Defaults to 12 weeks. */
  horizonWeeks?: number;
};

export type PlannedBatch = {
  varietyId: string;
  /** The Monday of the week this Batch is harvested in. */
  harvestWeek: IsoDate;
  harvestDate: IsoDate;
  transplantDate: IsoDate;
  sowDate: IsoDate;
  plantsToTransplant: number;
  plantsToSow: number;
};

export type SowTask = {
  kind: "SOW";
  varietyId: string;
  harvestWeek: IsoDate;
  harvestDate: IsoDate;
  dueDate: IsoDate;
  overdue: boolean;
  plants: number;
};

export type TransplantTask = {
  kind: "TRANSPLANT";
  varietyId: string;
  batchId: string;
  harvestWeek: IsoDate;
  /** When the Batch is now expected to be harvested, counting from the actual sow date. */
  harvestDate: IsoDate;
  dueDate: IsoDate;
  overdue: boolean;
  /** Seedlings expected to be ready to move. */
  plants: number;
};

export type HarvestTask = {
  kind: "HARVEST";
  varietyId: string;
  batchId: string;
  placementId: string;
  tableId: string | null;
  harvestWeek: IsoDate;
  /** Same as `dueDate`, so every kind of Task can be shown with a harvest date. */
  harvestDate: IsoDate;
  dueDate: IsoDate;
  overdue: boolean;
  plants: number;
  expectedKg: number;
};

export type Task = SowTask | TransplantTask | HarvestTask;

/** An Active Batch with the dates it is now expected to reach, from its actual sow date. */
export type ActiveBatchPlan = {
  batchId: string;
  varietyId: string;
  harvestWeek: IsoDate;
  sowDate: IsoDate;
  sownCount: number;
  transplantDate: IsoDate;
  harvestDate: IsoDate;
  plantsToTransplant: number;
};

/** One Batch's contribution to a week's harvest. `actual` means the kilograms were really weighed. */
export type WeekBatchLine = {
  kind: "PLANNED" | "ACTIVE" | "CLOSED";
  /** null for a Planned Batch. */
  batchId: string | null;
  varietyId: string;
  /** The week the Batch was planned for, which can differ from the week it is harvested in. */
  harvestWeek: IsoDate;
  sowDate: IsoDate;
  transplantDate: IsoDate;
  harvestDate: IsoDate;
  kg: number;
  actual: boolean;
};

/** What one Variety is expected to deliver in one week, against its Harvest Target. */
export type WeekPlan = {
  varietyId: string;
  /** The Monday of the week. */
  week: IsoDate;
  harvestDate: IsoDate;
  targetKg: number;
  /** Expected kilograms, with the kilograms really weighed where a Placement is already harvested. */
  expectedKg: number;
  actualKg: number;
  shortfallKg: number;
  lines: WeekBatchLine[];
};

export type SlotForecastWeek = {
  week: IsoDate;
  /** The most Slots in use on any day of the week. */
  peak: number;
  capacity: number;
  over: boolean;
};

export type Schedule = {
  plannedBatches: PlannedBatch[];
  activeBatches: ActiveBatchPlan[];
  tasks: Task[];
  /** Four weeks back through the horizon, only for weeks that have a target or a Batch. */
  weeks: WeekPlan[];
  /** The current week through the horizon. */
  slotForecast: SlotForecastWeek[];
};

const DEFAULT_HORIZON_WEEKS = 12;
// Backstop for a loop that is already bounded by the horizon.
const MAX_WEEKS_SCANNED = 520;

// Integer arithmetic throughout: 1.1 kg * 1000 is 1100.0000000000002 in floating point.
function ceilDiv(numerator: number, denominator: number) {
  return Math.floor((numerator + denominator - 1) / denominator);
}

function plantCounts(kgPerWeek: number, variety: VarietyInput) {
  const grams = Math.round(kgPerWeek * 1000);
  const plantsToTransplant = ceilDiv(grams, variety.gramsPerPlant);
  const plantsToSow = ceilDiv(plantsToTransplant * 100, variety.survivalPercent);
  return { plantsToTransplant, plantsToSow };
}

function datesForWeek(variety: VarietyInput, week: IsoDate, harvestWeekday: number) {
  const harvestDate = harvestDateForWeek(week, harvestWeekday);
  const transplantDate = addDays(harvestDate, -variety.growOutDays);
  const sowDate = addDays(transplantDate, -(variety.nurseryDays + variety.germinationDays));
  return { harvestDate, transplantDate, sowDate };
}

/**
 * Plans one Batch per Variety per week, counting back from the Harvest Day.
 *
 * Covers every harvest week whose Harvest Day has not passed and whose sow date is within the horizon
 * from today. Weeks whose sow date has already passed are still listed, with an overdue Sow Task.
 * Planned Batches are derived on every call and never stored (ADR-0001).
 */
export function buildSchedule(input: ScheduleInput): Schedule {
  const { harvestWeekday, today } = input;
  const horizonEnd = addDays(today, (input.horizonWeeks ?? DEFAULT_HORIZON_WEEKS) * 7);
  const skipped = new Set(input.skippedWeeks.map((s) => `${s.varietyId}|${s.week}`));
  // One Batch per Variety per week: a real Batch (Active or Closed) takes the week.
  const taken = new Set(input.batches.map((b) => `${b.varietyId}|${b.harvestWeek}`));

  const plannedBatches: PlannedBatch[] = [];

  for (const variety of input.varieties) {
    const versions = input.targets
      .filter((t) => t.varietyId === variety.id)
      .sort((a, b) => (a.effectiveWeek < b.effectiveWeek ? 1 : -1)); // latest first
    if (versions.length === 0) continue;

    let week = mondayOf(today);
    for (let scanned = 0; scanned < MAX_WEEKS_SCANNED; scanned++, week = addDays(week, 7)) {
      const dates = datesForWeek(variety, week, harvestWeekday);
      if (dates.sowDate > horizonEnd) break;
      if (dates.harvestDate < today) continue;
      if (skipped.has(`${variety.id}|${week}`) || taken.has(`${variety.id}|${week}`)) continue;

      const target = versions.find((t) => t.effectiveWeek <= week);
      if (!target || target.kgPerWeek <= 0) continue;

      plannedBatches.push({
        varietyId: variety.id,
        harvestWeek: week,
        ...dates,
        ...plantCounts(target.kgPerWeek, variety),
      });
    }
  }

  plannedBatches.sort(
    (a, b) => a.harvestWeek.localeCompare(b.harvestWeek) || a.varietyId.localeCompare(b.varietyId),
  );

  const activeBatches: ActiveBatchPlan[] = input.batches
    .filter((batch) => batch.status === "ACTIVE")
    .map((batch) => {
      const transplantDate = addDays(batch.sowDate, batch.germinationDays + batch.nurseryDays);
      return {
        batchId: batch.id,
        varietyId: batch.varietyId,
        harvestWeek: batch.harvestWeek,
        sowDate: batch.sowDate,
        sownCount: batch.sownCount,
        transplantDate,
        harvestDate: addDays(transplantDate, batch.growOutDays),
        // Rounded down: a fraction of a seedling is not a plant to move.
        plantsToTransplant: Math.floor((batch.sownCount * batch.survivalPercent) / 100),
      };
    })
    .sort((a, b) => a.harvestWeek.localeCompare(b.harvestWeek) || a.varietyId.localeCompare(b.varietyId));

  const sowTasks: Task[] = plannedBatches.map((batch) => ({
    kind: "SOW",
    varietyId: batch.varietyId,
    harvestWeek: batch.harvestWeek,
    harvestDate: batch.harvestDate,
    dueDate: batch.sowDate,
    overdue: batch.sowDate < today,
    plants: batch.plantsToSow,
  }));

  const batchById = new Map(input.batches.map((b) => [b.id, b]));

  const transplantTasks: Task[] = [];
  for (const plan of activeBatches) {
    const batch = batchById.get(plan.batchId)!;
    if (batch.nurseryRemaining === 0) continue; // everything has been moved or discarded

    // Seedlings kept in the nursery after a partial transplant can be moved whenever there is room: today.
    const kept = batch.nurseryRemaining !== null;
    const dueDate = kept ? today : plan.transplantDate;
    transplantTasks.push({
      kind: "TRANSPLANT",
      varietyId: plan.varietyId,
      batchId: plan.batchId,
      harvestWeek: plan.harvestWeek,
      harvestDate: plan.harvestDate,
      dueDate,
      overdue: dueDate < today,
      plants: kept ? batch.nurseryRemaining! : plan.plantsToTransplant,
    });
  }

  const harvestTasks: Task[] = [];
  for (const batch of input.batches) {
    for (const placement of batch.placements) {
      if (placement.harvestDate !== null) continue;
      const dueDate = addDays(placement.transplantDate, batch.growOutDays);
      harvestTasks.push({
        kind: "HARVEST",
        varietyId: batch.varietyId,
        batchId: batch.id,
        placementId: placement.id,
        tableId: placement.tableId,
        harvestWeek: batch.harvestWeek,
        harvestDate: dueDate,
        dueDate,
        overdue: dueDate < today,
        plants: placement.plantCount,
        expectedKg: (placement.plantCount * batch.gramsPerPlant) / 1000,
      });
    }
  }

  const taskId = (t: Task) => (t.kind === "HARVEST" ? t.placementId : "");
  const tasks = [...sowTasks, ...transplantTasks, ...harvestTasks].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.varietyId.localeCompare(b.varietyId) ||
      a.kind.localeCompare(b.kind) ||
      taskId(a).localeCompare(taskId(b)),
  );

  return {
    plannedBatches,
    activeBatches,
    tasks,
    weeks: buildWeeks(input, plannedBatches, activeBatches),
    slotForecast: buildSlotForecast(input, plannedBatches),
  };
}

const PAST_WEEKS_SHOWN = 4;

// Round to the gram so sums of kilograms carry no floating point noise.
const round3 = (n: number) => Math.round(n * 1000) / 1000;

function targetKgFor(input: ScheduleInput, varietyId: string, week: IsoDate) {
  if (input.skippedWeeks.some((s) => s.varietyId === varietyId && s.week === week)) return 0;
  const version = input.targets
    .filter((t) => t.varietyId === varietyId && t.effectiveWeek <= week)
    .sort((a, b) => (a.effectiveWeek < b.effectiveWeek ? 1 : -1))[0]; // latest first
  return version ? Math.max(0, version.kgPerWeek) : 0;
}

function buildWeeks(
  input: ScheduleInput,
  plannedBatches: PlannedBatch[],
  activeBatches: ActiveBatchPlan[],
): WeekPlan[] {
  const { today, harvestWeekday } = input;
  const thisWeek = mondayOf(today);
  const firstWeek = addDays(thisWeek, -7 * PAST_WEEKS_SHOWN);
  const lastWeek = addDays(thisWeek, 7 * ((input.horizonWeeks ?? DEFAULT_HORIZON_WEEKS) - 1));
  const gramsOf = new Map(input.varieties.map((v) => [v.id, v.gramsPerPlant]));

  const lines: WeekBatchLine[] = [];

  for (const batch of plannedBatches) {
    lines.push({
      kind: "PLANNED",
      batchId: null,
      varietyId: batch.varietyId,
      harvestWeek: batch.harvestWeek,
      sowDate: batch.sowDate,
      transplantDate: batch.transplantDate,
      harvestDate: batch.harvestDate,
      kg: round3((batch.plantsToTransplant * (gramsOf.get(batch.varietyId) ?? 0)) / 1000),
      actual: false,
    });
  }

  const planOf = new Map(activeBatches.map((a) => [a.batchId, a]));
  for (const batch of input.batches) {
    const kind = batch.status === "CLOSED" ? "CLOSED" : "ACTIVE";
    const base = {
      kind,
      batchId: batch.id,
      varietyId: batch.varietyId,
      harvestWeek: batch.harvestWeek,
      sowDate: batch.sowDate,
    } as const;

    for (const placement of batch.placements) {
      if (placement.harvestDate !== null) {
        lines.push({
          ...base,
          transplantDate: placement.transplantDate,
          harvestDate: placement.harvestDate,
          kg: round3(placement.harvestKg ?? 0),
          actual: true,
        });
      } else {
        lines.push({
          ...base,
          transplantDate: placement.transplantDate,
          harvestDate: addDays(placement.transplantDate, batch.growOutDays),
          kg: round3((placement.plantCount * batch.gramsPerPlant) / 1000),
          actual: false,
        });
      }
    }

    // Seedlings that are not on a Table yet: expected from the sow, or kept back and moved from today.
    const plan = planOf.get(batch.id);
    if (!plan || batch.nurseryRemaining === 0) continue;
    const kept = batch.nurseryRemaining !== null;
    const transplantDate = kept ? today : plan.transplantDate;
    lines.push({
      ...base,
      transplantDate,
      harvestDate: addDays(transplantDate, batch.growOutDays),
      kg: round3(
        ((kept ? batch.nurseryRemaining! : plan.plantsToTransplant) * batch.gramsPerPlant) / 1000,
      ),
      actual: false,
    });
  }

  const byWeek = new Map<string, WeekBatchLine[]>();
  for (const line of lines) {
    const key = `${line.varietyId}|${mondayOf(line.harvestDate)}`;
    byWeek.set(key, [...(byWeek.get(key) ?? []), line]);
  }

  const weeks: WeekPlan[] = [];
  for (const variety of input.varieties) {
    for (let week = firstWeek; week <= lastWeek; week = addDays(week, 7)) {
      const weekLines = byWeek.get(`${variety.id}|${week}`) ?? [];
      const targetKg = targetKgFor(input, variety.id, week);
      if (targetKg === 0 && weekLines.length === 0) continue;

      const expectedKg = round3(weekLines.reduce((sum, l) => sum + l.kg, 0));
      weeks.push({
        varietyId: variety.id,
        week,
        harvestDate: harvestDateForWeek(week, harvestWeekday),
        targetKg,
        expectedKg,
        actualKg: round3(weekLines.filter((l) => l.actual).reduce((sum, l) => sum + l.kg, 0)),
        shortfallKg: round3(Math.max(0, targetKg - expectedKg)),
        lines: weekLines.sort((a, b) => a.harvestDate.localeCompare(b.harvestDate)),
      });
    }
  }
  return weeks.sort((a, b) => a.week.localeCompare(b.week) || a.varietyId.localeCompare(b.varietyId));
}

type Occupancy = { start: IsoDate; end: IsoDate; slots: number };

/**
 * Slots in use, week by week. A group of plants holds its Slots from the day it goes on the Table until
 * the day it is harvested, which is free again on that same day. Plants that are overdue stay on the
 * Table until harvested, and a Planned Batch whose sow day has passed is treated as if it were sown today.
 */
function buildSlotForecast(input: ScheduleInput, plannedBatches: PlannedBatch[]): SlotForecastWeek[] {
  const { today } = input;
  const tomorrow = addDays(today, 1);
  const thisWeek = mondayOf(today);
  const lastWeek = addDays(thisWeek, 7 * ((input.horizonWeeks ?? DEFAULT_HORIZON_WEEKS) - 1));
  const varietyById = new Map(input.varieties.map((v) => [v.id, v]));
  const maxDate = (a: IsoDate, b: IsoDate) => (a > b ? a : b);

  const stays: Occupancy[] = [];

  for (const batch of input.batches) {
    for (const placement of batch.placements) {
      if (placement.harvestDate !== null) continue;
      stays.push({
        start: placement.transplantDate,
        end: maxDate(addDays(placement.transplantDate, batch.growOutDays), tomorrow),
        slots: placement.plantCount,
      });
    }
    if (batch.status !== "ACTIVE" || batch.nurseryRemaining === 0) continue;
    const kept = batch.nurseryRemaining !== null;
    const expectedStart = addDays(batch.sowDate, batch.germinationDays + batch.nurseryDays);
    const start = kept ? today : maxDate(expectedStart, today);
    stays.push({
      start,
      end: addDays(start, batch.growOutDays),
      slots: kept
        ? batch.nurseryRemaining!
        : Math.floor((batch.sownCount * batch.survivalPercent) / 100),
    });
  }

  for (const planned of plannedBatches) {
    const variety = varietyById.get(planned.varietyId);
    if (!variety) continue;
    const start =
      planned.sowDate < today
        ? addDays(today, variety.germinationDays + variety.nurseryDays)
        : planned.transplantDate;
    stays.push({ start, end: addDays(start, variety.growOutDays), slots: planned.plantsToTransplant });
  }

  const forecast: SlotForecastWeek[] = [];
  for (let week = thisWeek; week <= lastWeek; week = addDays(week, 7)) {
    let peak = 0;
    for (let day = maxDate(week, today); day < addDays(week, 7); day = addDays(day, 1)) {
      let inUse = 0;
      for (const stay of stays) {
        if (stay.start <= day && day < stay.end) inUse += stay.slots;
      }
      peak = Math.max(peak, inUse);
    }
    forecast.push({ week, peak, capacity: input.slotCapacity, over: peak > input.slotCapacity });
  }
  return forecast;
}

type GrowthRates = Pick<VarietyInput, "growOutDays" | "survivalPercent" | "gramsPerPlant">;

const weeksOnTable = (variety: GrowthRates) => Math.ceil(variety.growOutDays / 7);

/**
 * Slots a target keeps occupied once succession is running: plants moved to the Tables each week,
 * times the number of weeks each batch of them stays there.
 */
export function standingSlots(variety: GrowthRates, kgPerWeek: number): number {
  if (kgPerWeek <= 0) return 0;
  const grams = Math.round(kgPerWeek * 1000);
  return ceilDiv(grams, variety.gramsPerPlant) * weeksOnTable(variety);
}

/** The most kilograms per week (to 0.1 kg) whose standing Slots still fit in `availableSlots`. */
export function maxSupportableKg(variety: GrowthRates, availableSlots: number): number {
  if (availableSlots <= 0) return 0;
  const plantsPerWeek = Math.floor(availableSlots / weeksOnTable(variety));
  return Math.floor((plantsPerWeek * variety.gramsPerPlant) / 100) / 10;
}

/**
 * The first harvest week a new target can start from without producing an overdue Sow Task:
 * its Harvest Day has not passed and its sow date is today or later.
 */
export function earliestReachableHarvestWeek(
  variety: VarietyInput,
  harvestWeekday: number,
  today: IsoDate,
): IsoDate {
  let week = mondayOf(today);
  for (let scanned = 0; scanned < MAX_WEEKS_SCANNED; scanned++, week = addDays(week, 7)) {
    const { harvestDate, sowDate } = datesForWeek(variety, week, harvestWeekday);
    if (harvestDate >= today && sowDate >= today) return week;
  }
  return week;
}
