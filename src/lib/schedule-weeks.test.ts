import { describe, expect, it } from "vitest";
import {
  type BatchInput,
  buildSchedule,
  maxSupportableKg,
  type ScheduleInput,
  standingSlots,
  type VarietyInput,
} from "./schedule";

// Green oak: 5 days to germinate + 14 in the nursery + 30 on the Table = 49 days from Sow to Harvest.
const greenOak: VarietyInput = {
  id: "oak",
  name: "กรีนโอ๊ค",
  germinationDays: 5,
  nurseryDays: 14,
  growOutDays: 30,
  survivalPercent: 85,
  gramsPerPlant: 120,
};

// 2026-09-01 is a Tuesday; weeks run Monday to Sunday and the Harvest Day is Monday.
function input(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    harvestWeekday: 1,
    varieties: [greenOak],
    targets: [{ varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 10 }],
    skippedWeeks: [],
    batches: [],
    slotCapacity: 1000,
    today: "2026-09-01",
    ...overrides,
  };
}

// Sown 2026-08-31, so it is expected on the Table from 2026-09-19 until 2026-10-19.
const sownBatch: BatchInput = {
  id: "b1",
  varietyId: "oak",
  harvestWeek: "2026-10-26",
  sowDate: "2026-08-31",
  sownCount: 99,
  status: "ACTIVE",
  nurseryRemaining: null,
  placements: [],
  germinationDays: 5,
  nurseryDays: 14,
  growOutDays: 30,
  survivalPercent: 85,
  gramsPerPlant: 120,
};

const placement = (overrides: Partial<BatchInput["placements"][number]> = {}) => ({
  id: "p1",
  tableId: "A",
  plantCount: 84,
  transplantDate: "2026-09-19",
  harvestDate: null,
  harvestKg: null,
  ...overrides,
});

const batch = (overrides: Partial<BatchInput> = {}): BatchInput => ({ ...sownBatch, ...overrides });

// ---------- Expected kilograms against the Harvest Target ----------

describe("weekly expected kilograms and Shortfall", () => {
  const weekRow = (schedule: ReturnType<typeof buildSchedule>, week: string, varietyId = "oak") =>
    schedule.weeks.find((w) => w.week === week && w.varietyId === varietyId);

  it("expects a Planned Batch to deliver its plants to transplant times the weight per plant", () => {
    const row = weekRow(buildSchedule(input()), "2026-10-26");
    expect(row).toMatchObject({ targetKg: 10, expectedKg: 10.08, actualKg: 0, shortfallKg: 0 });
    expect(row?.lines).toEqual([
      expect.objectContaining({ kind: "PLANNED", kg: 10.08, harvestDate: "2026-10-26" }),
    ]);
  });

  it("expects a sown Batch that is not transplanted yet to deliver floor(sown * survival) plants", () => {
    // Sown 2026-09-07 for the 10-26 harvest week: 50 sown -> 42 plants -> 5.04 kg from a 10 kg target.
    const schedule = buildSchedule(input({ batches: [batch({ sownCount: 50, sowDate: "2026-09-07" })] }));
    expect(weekRow(schedule, "2026-10-26")).toMatchObject({ expectedKg: 5.04, shortfallKg: 4.96 });
  });

  it("counts a Batch in the week it is now expected to be harvested, not the week it was planned for", () => {
    // Sown a week early (2026-08-31): harvest moves to 2026-10-19, so week 10-26 gets nothing from it.
    const schedule = buildSchedule(input({ batches: [batch()] }));
    const early = weekRow(schedule, "2026-10-19")?.lines.find((l) => l.batchId === "b1");
    expect(early).toMatchObject({ kind: "ACTIVE", kg: 10.08, harvestDate: "2026-10-19" });
    expect(weekRow(schedule, "2026-10-26")).toMatchObject({ expectedKg: 0, shortfallKg: 10 });
  });

  it("expects transplanted plants from each Placement on its own harvest date", () => {
    const schedule = buildSchedule(
      input({
        targets: [{ varietyId: "oak", effectiveWeek: "2026-10-26", kgPerWeek: 10 }],
        batches: [
          batch({
            nurseryRemaining: 0,
            placements: [
              placement({ plantCount: 60, transplantDate: "2026-09-19" }),
              placement({ id: "p2", plantCount: 24, transplantDate: "2026-09-28" }),
            ],
          }),
        ],
      }),
    );
    expect(weekRow(schedule, "2026-10-19")?.expectedKg).toBe(7.2); // p1, 10-19
    expect(weekRow(schedule, "2026-10-26")?.expectedKg).toBe(2.88); // p2, 10-28
  });

  it("uses the kilograms weighed, not the expectation, once a Placement is harvested", () => {
    const schedule = buildSchedule(
      input({
        targets: [{ varietyId: "oak", effectiveWeek: "2026-10-26", kgPerWeek: 10 }],
        batches: [
          batch({
            nurseryRemaining: 0,
            placements: [
              placement({ harvestDate: "2026-10-19", harvestKg: 9.4 }),
              placement({ id: "p2", plantCount: 15, transplantDate: "2026-09-27" }),
            ],
          }),
        ],
      }),
    );
    expect(weekRow(schedule, "2026-10-19")).toMatchObject({ actualKg: 9.4, expectedKg: 9.4 });
    // The Placement of the same Batch that is still growing lands in its own week.
    expect(weekRow(schedule, "2026-10-26")).toMatchObject({ actualKg: 0, expectedKg: 1.8 });
  });

  it("counts seedlings kept in the nursery from the day they can be transplanted", () => {
    // Moved today (2026-09-01) -> 30 days on the Table -> harvested 2026-10-01, in the week of 09-28.
    const schedule = buildSchedule(
      input({
        targets: [],
        batches: [
          batch({
            nurseryRemaining: 15,
            placements: [placement({ harvestDate: "2026-09-01", harvestKg: 5 })],
          }),
        ],
      }),
    );
    expect(weekRow(schedule, "2026-09-28")?.expectedKg).toBe(1.8);
  });

  it("shows past weeks with the kilograms actually harvested against the target", () => {
    const schedule = buildSchedule(
      input({
        today: "2026-09-14",
        batches: [
          batch({
            status: "CLOSED",
            nurseryRemaining: 0,
            placements: [placement({ harvestDate: "2026-09-07", harvestKg: 9 })],
          }),
        ],
      }),
    );
    expect(weekRow(schedule, "2026-09-07")).toMatchObject({
      targetKg: 10,
      actualKg: 9,
      expectedKg: 9,
      shortfallKg: 1,
    });
    expect(weekRow(schedule, "2026-09-07")?.lines[0]).toMatchObject({ kind: "CLOSED", actual: true });
  });

  it("shows a past week with a target and nothing harvested as a full Shortfall", () => {
    const schedule = buildSchedule(input({ today: "2026-09-14" }));
    expect(weekRow(schedule, "2026-09-07")).toMatchObject({ targetKg: 10, expectedKg: 0, shortfallKg: 10 });
  });

  it("treats a skipped week as having no target", () => {
    const schedule = buildSchedule(input({ skippedWeeks: [{ varietyId: "oak", week: "2026-10-26" }] }));
    expect(weekRow(schedule, "2026-10-26")).toBeUndefined();
  });

  it("covers four weeks back and the horizon forward, and no more", () => {
    const started = [{ varietyId: "oak", effectiveWeek: "2026-06-01", kgPerWeek: 10 }];
    const weeks = buildSchedule(input({ targets: started })).weeks.map((w) => w.week);
    expect(weeks[0]).toBe("2026-08-03");
    expect(weeks[weeks.length - 1]).toBe("2026-11-16"); // the Monday 11 weeks after this week
  });

  it("rounds kilograms to the gram so sums do not carry floating point noise", () => {
    const schedule = buildSchedule(input({ batches: [batch({ sownCount: 50, sowDate: "2026-09-07" })] }));
    expect(weekRow(schedule, "2026-10-26")?.shortfallKg).toBe(4.96);
  });
});

// ---------- Slots ----------

describe("standing Slots", () => {
  it("is plants to transplant per week times the weeks spent on the Table", () => {
    expect(standingSlots(greenOak, 10)).toBe(420); // 84 plants * ceil(30 / 7) = 5 weeks
  });

  it("rounds the weeks on the Table up", () => {
    expect(standingSlots({ ...greenOak, growOutDays: 28 }, 10)).toBe(336); // exactly 4 weeks
    expect(standingSlots({ ...greenOak, growOutDays: 29 }, 10)).toBe(420); // 4.14 -> 5 weeks
  });

  it("is 0 for a 0 kg target", () => {
    expect(standingSlots(greenOak, 0)).toBe(0);
  });
});

describe("maxSupportableKg", () => {
  it("is the most kilograms per week whose standing Slots fit in the room that is left", () => {
    expect(maxSupportableKg(greenOak, 420)).toBe(10);
    expect(maxSupportableKg(greenOak, 100)).toBe(2.4); // 20 plants a week
  });

  it("never promises more than fits", () => {
    for (const room of [1, 4, 5, 99, 421, 1000]) {
      expect(standingSlots(greenOak, maxSupportableKg(greenOak, room))).toBeLessThanOrEqual(room);
    }
  });

  it("is 0 when there is no room", () => {
    expect(maxSupportableKg(greenOak, 0)).toBe(0);
    expect(maxSupportableKg(greenOak, -10)).toBe(0);
  });
});

describe("Slot forecast", () => {
  const standing = (overrides: Partial<BatchInput["placements"][number]>) =>
    placement({ transplantDate: "2026-08-20", ...overrides });
  const withPlacements = (placements: BatchInput["placements"], overrides: Partial<ScheduleInput> = {}) =>
    buildSchedule(
      input({ targets: [], batches: [batch({ nurseryRemaining: 0, placements })], ...overrides }),
    );
  const peakOf = (schedule: ReturnType<typeof buildSchedule>, week: string) =>
    schedule.slotForecast.find((w) => w.week === week)?.peak;

  it("holds a Placement until its expected harvest day", () => {
    const schedule = withPlacements([standing({})]); // harvest 2026-09-19
    expect(peakOf(schedule, "2026-08-31")).toBe(84);
    expect(peakOf(schedule, "2026-09-14")).toBe(84); // still there until the 19th
    expect(peakOf(schedule, "2026-09-21")).toBe(0);
  });

  it("frees the Slots on the harvest day itself", () => {
    // A Batch planned for 2026-10-26: on the Table 09-26 to 10-26. Week 10-19 is full, week 10-26 is empty.
    const schedule = buildSchedule(
      input({
        targets: [
          { varietyId: "oak", effectiveWeek: "2026-10-26", kgPerWeek: 10 },
          { varietyId: "oak", effectiveWeek: "2026-11-02", kgPerWeek: 0 },
        ],
      }),
    );
    expect(peakOf(schedule, "2026-10-19")).toBe(84);
    expect(peakOf(schedule, "2026-10-26")).toBe(0);
  });

  it("does not add two Placements that only touch on the changeover day", () => {
    const schedule = withPlacements([
      standing({}), // harvested 2026-09-19
      standing({ id: "p2", transplantDate: "2026-09-19" }), // starts the day p1 is harvested
    ]);
    expect(peakOf(schedule, "2026-09-14")).toBe(84);
  });

  it("adds Placements that overlap", () => {
    const schedule = withPlacements([standing({}), standing({ id: "p2", transplantDate: "2026-09-01" })]);
    expect(peakOf(schedule, "2026-08-31")).toBe(168);
  });

  it("keeps an overdue Placement on the Table until it is harvested", () => {
    // Should have been harvested on 2026-08-14 but still stands there today.
    const schedule = withPlacements([standing({ transplantDate: "2026-07-15" })]);
    expect(peakOf(schedule, "2026-08-31")).toBe(84);
  });

  it("counts seedlings that have not been transplanted yet from their transplant day", () => {
    // Sown 2026-08-31: transplant 2026-09-19, on the Table until 2026-10-19.
    const schedule = buildSchedule(input({ targets: [], batches: [sownBatch] }));
    expect(peakOf(schedule, "2026-09-07")).toBe(0);
    expect(peakOf(schedule, "2026-09-14")).toBe(84); // from Saturday the 19th
    expect(peakOf(schedule, "2026-10-12")).toBe(84);
    expect(peakOf(schedule, "2026-10-19")).toBe(0); // freed on the 19th itself
  });

  it("plans a Planned Batch whose sow day has passed as if it were sown today", () => {
    // Week 2026-09-07 should have been sown in July. It can only be sown from today (2026-09-01),
    // so it reaches the Table 19 days later, on 2026-09-20.
    const schedule = buildSchedule(
      input({
        targets: [
          { varietyId: "oak", effectiveWeek: "2026-09-07", kgPerWeek: 10 },
          { varietyId: "oak", effectiveWeek: "2026-09-14", kgPerWeek: 0 },
        ],
      }),
    );
    expect(peakOf(schedule, "2026-09-07")).toBe(0); // still in the nursery
    expect(peakOf(schedule, "2026-09-14")).toBe(84); // on the Table from Sunday the 20th
  });

  it("flags the weeks that need more Slots than the Farm has", () => {
    const schedule = withPlacements(
      [standing({}), standing({ id: "p2", transplantDate: "2026-09-01" })],
      { slotCapacity: 150 },
    );
    expect(schedule.slotForecast.find((w) => w.week === "2026-08-31")).toMatchObject({
      peak: 168,
      capacity: 150,
      over: true,
    });
    expect(schedule.slotForecast.find((w) => w.week === "2026-09-21")?.over).toBe(false);
  });

  it("starts at the current week and runs to the horizon", () => {
    const weeks = buildSchedule(input()).slotForecast.map((w) => w.week);
    expect(weeks[0]).toBe("2026-08-31");
    expect(weeks[weeks.length - 1]).toBe("2026-11-16");
  });
});
