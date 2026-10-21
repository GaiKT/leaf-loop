import { describe, expect, it } from "vitest";
import {
  type BatchInput,
  buildSchedule,
  earliestReachableHarvestWeek,
  type ScheduleInput,
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

// 2026-09-01 is a Tuesday. With a 49-day cycle, the first harvest week that can still be sown on time is 2026-10-26.
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

function batchFor(overrides: Partial<ScheduleInput>, harvestWeek: string, varietyId = "oak") {
  return buildSchedule(input(overrides)).plannedBatches.find(
    (b) => b.harvestWeek === harvestWeek && b.varietyId === varietyId,
  );
}

describe("back-calculated dates", () => {
  it("counts back from the Harvest Day through Grow-out, nursery and germination", () => {
    const batch = batchFor({}, "2026-10-26");
    expect(batch?.harvestDate).toBe("2026-10-26");
    expect(batch?.transplantDate).toBe("2026-09-26"); // 30 days before
    expect(batch?.sowDate).toBe("2026-09-07"); // 14 + 5 days before that
  });

  it("crosses a month and a year boundary", () => {
    const batch = batchFor({}, "2027-01-04");
    expect(batch?.transplantDate).toBe("2026-12-05");
    expect(batch?.sowDate).toBe("2026-11-16");
  });

  it("uses a Grow-out that is not a multiple of 7", () => {
    const slow: VarietyInput = { ...greenOak, id: "cos", growOutDays: 37 };
    const batch = batchFor({ varieties: [slow], targets: [{ varietyId: "cos", effectiveWeek: "2026-08-31", kgPerWeek: 5 }] }, "2026-10-26", "cos");
    expect(batch?.transplantDate).toBe("2026-09-19");
    expect(batch?.sowDate).toBe("2026-08-31");
  });

  it("follows the farm's Harvest Day within the week", () => {
    const wednesday = batchFor({ harvestWeekday: 3 }, "2026-10-26");
    expect(wednesday?.harvestDate).toBe("2026-10-28");
    expect(wednesday?.sowDate).toBe("2026-09-09");

    const sunday = batchFor({ harvestWeekday: 0 }, "2026-10-26");
    expect(sunday?.harvestDate).toBe("2026-11-01");
  });
});

describe("plant counts", () => {
  it("plans 84 plants to transplant and 99 to sow for 10 kg of green oak", () => {
    const batch = batchFor({}, "2026-10-26");
    expect(batch?.plantsToTransplant).toBe(84); // ceil(10000 / 120)
    expect(batch?.plantsToSow).toBe(99); // ceil(84 / 0.85)
  });

  it("does not round up when the division is exact", () => {
    const exact: VarietyInput = { ...greenOak, survivalPercent: 100 };
    const batch = batchFor({ varieties: [exact], targets: [{ varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 12 }] }, "2026-10-26");
    expect(batch?.plantsToTransplant).toBe(100);
    expect(batch?.plantsToSow).toBe(100);
  });

  it("is not thrown off by floating point in decimal kilograms", () => {
    // 1.1 * 1000 is 1100.0000000000002 in floating point, which would round up to 12 plants.
    const light: VarietyInput = { ...greenOak, survivalPercent: 100, gramsPerPlant: 100 };
    const batch = batchFor({ varieties: [light], targets: [{ varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 1.1 }] }, "2026-10-26");
    expect(batch?.plantsToTransplant).toBe(11);
  });
});

describe("Harvest Targets", () => {
  const raised = [
    { varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
    { varietyId: "oak", effectiveWeek: "2026-10-12", kgPerWeek: 15 },
  ];

  it("uses the version with the latest effective week on or before each harvest week", () => {
    expect(batchFor({ targets: raised }, "2026-10-05")?.plantsToTransplant).toBe(84);
    expect(batchFor({ targets: raised }, "2026-10-12")?.plantsToTransplant).toBe(125);
    expect(batchFor({ targets: raised }, "2026-10-19")?.plantsToTransplant).toBe(125);
  });

  it("does not depend on the order the versions are given in", () => {
    expect(batchFor({ targets: [...raised].reverse() }, "2026-10-12")?.plantsToTransplant).toBe(125);
  });

  it("plans nothing from the week a target is set to 0 kg", () => {
    const stopped = [...raised, { varietyId: "oak", effectiveWeek: "2026-11-02", kgPerWeek: 0 }];
    expect(batchFor({ targets: stopped }, "2026-10-26")).toBeDefined();
    expect(batchFor({ targets: stopped }, "2026-11-02")).toBeUndefined();
    expect(batchFor({ targets: stopped }, "2026-11-09")).toBeUndefined();
  });

  it("plans nothing before the first target takes effect", () => {
    const later = [{ varietyId: "oak", effectiveWeek: "2026-10-26", kgPerWeek: 10 }];
    expect(batchFor({ targets: later }, "2026-10-19")).toBeUndefined();
    expect(batchFor({ targets: later }, "2026-10-26")).toBeDefined();
  });

  it("plans nothing for a Variety with no target", () => {
    expect(buildSchedule(input({ targets: [] })).plannedBatches).toEqual([]);
  });

  it("keeps targets of different Varieties apart", () => {
    const cos: VarietyInput = { ...greenOak, id: "cos", name: "คอส", growOutDays: 35 };
    const schedule = buildSchedule(
      input({
        varieties: [greenOak, cos],
        targets: [
          { varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
          { varietyId: "cos", effectiveWeek: "2026-08-31", kgPerWeek: 6 },
        ],
      }),
    );
    const oak = schedule.plannedBatches.find((b) => b.varietyId === "oak" && b.harvestWeek === "2026-10-26");
    const cosBatch = schedule.plannedBatches.find((b) => b.varietyId === "cos" && b.harvestWeek === "2026-10-26");
    expect(oak?.plantsToTransplant).toBe(84);
    expect(cosBatch?.plantsToTransplant).toBe(50);
    expect(cosBatch?.sowDate).toBe("2026-09-02"); // 5 days earlier than green oak
  });
});

describe("Skipped Weeks", () => {
  it("plans no Batch for a skipped week and leaves the other weeks alone", () => {
    const skipped = [{ varietyId: "oak", week: "2026-10-26" }];
    expect(batchFor({ skippedWeeks: skipped }, "2026-10-26")).toBeUndefined();
    expect(batchFor({ skippedWeeks: skipped }, "2026-10-19")).toBeDefined();
    expect(batchFor({ skippedWeeks: skipped }, "2026-11-02")).toBeDefined();
  });

  it("only skips the Variety it names", () => {
    const cos: VarietyInput = { ...greenOak, id: "cos", name: "คอส" };
    const schedule = buildSchedule(
      input({
        varieties: [greenOak, cos],
        targets: [
          { varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
          { varietyId: "cos", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
        ],
        skippedWeeks: [{ varietyId: "oak", week: "2026-10-26" }],
      }),
    );
    const weeksOf = (id: string) => schedule.plannedBatches.filter((b) => b.varietyId === id).map((b) => b.harvestWeek);
    expect(weeksOf("oak")).not.toContain("2026-10-26");
    expect(weeksOf("cos")).toContain("2026-10-26");
  });
});

describe("which weeks are planned", () => {
  it("starts at the first Harvest Day that has not passed", () => {
    const first = buildSchedule(input()).plannedBatches[0];
    expect(first.harvestWeek).toBe("2026-09-07"); // the Harvest Day of the current week, 2026-08-31, is gone
  });

  it("includes a Harvest Day that is today", () => {
    const first = buildSchedule(input({ today: "2026-09-07" })).plannedBatches[0];
    expect(first.harvestWeek).toBe("2026-09-07");
  });

  it("stops once Sow is more than 12 weeks away", () => {
    const batches = buildSchedule(input()).plannedBatches;
    const last = batches[batches.length - 1];
    // Sow of 2027-01-11 is 2026-11-23, which is 83 days from today. 2027-01-18 would be sown on 2026-11-30, which is 90.
    expect(last.harvestWeek).toBe("2027-01-11");
    expect(last.sowDate).toBe("2026-11-23");
  });

  it("honours a shorter horizon", () => {
    const batches = buildSchedule(input({ horizonWeeks: 4 })).plannedBatches;
    expect(batches.every((b) => b.sowDate <= "2026-09-29")).toBe(true);
    expect(batches[batches.length - 1].harvestWeek).toBe("2026-11-16");
  });

  it("lists Batches in harvest order", () => {
    const weeks = buildSchedule(input()).plannedBatches.map((b) => b.harvestWeek);
    expect(weeks).toEqual([...weeks].sort());
  });
});

describe("Sow Tasks", () => {
  it("makes one Sow Task per Planned Batch, due on its sow date, for the number to sow", () => {
    const { plannedBatches, tasks } = buildSchedule(input());
    expect(tasks).toHaveLength(plannedBatches.length);
    const task = tasks.find((t) => t.harvestWeek === "2026-10-26");
    expect(task).toMatchObject({ kind: "SOW", varietyId: "oak", dueDate: "2026-09-07", plants: 99 });
  });

  it("marks a Sow Task overdue when its day has passed", () => {
    const tasks = buildSchedule(input()).tasks;
    // Harvest week 2026-10-19 would have been sown on 2026-08-31, yesterday.
    expect(tasks.find((t) => t.harvestWeek === "2026-10-19")?.overdue).toBe(true);
    expect(tasks.find((t) => t.harvestWeek === "2026-10-26")?.overdue).toBe(false);
  });

  it("does not mark a Sow Task due today as overdue", () => {
    const tasks = buildSchedule(input({ today: "2026-09-07" })).tasks;
    const task = tasks.find((t) => t.harvestWeek === "2026-10-26");
    expect(task?.dueDate).toBe("2026-09-07");
    expect(task?.overdue).toBe(false);
  });

  it("lists Tasks by due date so overdue ones come first", () => {
    const due = buildSchedule(input()).tasks.map((t) => t.dueDate);
    expect(due).toEqual([...due].sort());
  });
});

describe("earliestReachableHarvestWeek", () => {
  it("is the first harvest week whose sow date is today or later", () => {
    expect(earliestReachableHarvestWeek(greenOak, 1, "2026-09-01")).toBe("2026-10-26");
  });

  it("still counts a harvest week whose sow date is today", () => {
    expect(earliestReachableHarvestWeek(greenOak, 1, "2026-09-07")).toBe("2026-10-26");
  });

  it("moves on to the next week the day after", () => {
    expect(earliestReachableHarvestWeek(greenOak, 1, "2026-09-08")).toBe("2026-11-02");
  });

  it("depends on the Harvest Day", () => {
    // A Sunday Harvest Day is six days later in the week, so its sow date is six days later too.
    expect(earliestReachableHarvestWeek(greenOak, 0, "2026-09-01")).toBe("2026-10-19");
  });

  it("agrees with buildSchedule: a target from that week creates no overdue Task", () => {
    const week = earliestReachableHarvestWeek(greenOak, 1, "2026-09-01");
    const tasks = buildSchedule(
      input({ targets: [{ varietyId: "oak", effectiveWeek: week, kgPerWeek: 10 }] }),
    ).tasks;
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((t) => t.overdue)).toBe(false);
  });
});

// Sown on 2026-08-31 for the 2026-10-26 harvest week, with green oak's values copied onto the Batch at Sow.
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

describe("Active Batches", () => {
  const withBatch = (batch: Partial<BatchInput> = {}, overrides: Partial<ScheduleInput> = {}) =>
    buildSchedule(input({ batches: [{ ...sownBatch, ...batch }], ...overrides }));

  it("replaces the Planned Batch for its Variety and week, and leaves other weeks planned", () => {
    const weeks = withBatch().plannedBatches.map((b) => b.harvestWeek);
    expect(weeks).not.toContain("2026-10-26");
    expect(weeks).toContain("2026-10-19");
    expect(weeks).toContain("2026-11-02");
  });

  it("is replaced the same way once it is Closed", () => {
    const weeks = withBatch({ status: "CLOSED" }).plannedBatches.map((b) => b.harvestWeek);
    expect(weeks).not.toContain("2026-10-26");
  });

  it("only blocks the Variety it belongs to", () => {
    const cos: VarietyInput = { ...greenOak, id: "cos", name: "คอส" };
    const schedule = buildSchedule(
      input({
        varieties: [greenOak, cos],
        targets: [
          { varietyId: "oak", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
          { varietyId: "cos", effectiveWeek: "2026-08-31", kgPerWeek: 10 },
        ],
        batches: [sownBatch],
      }),
    );
    const weeksOf = (id: string) => schedule.plannedBatches.filter((b) => b.varietyId === id).map((b) => b.harvestWeek);
    expect(weeksOf("oak")).not.toContain("2026-10-26");
    expect(weeksOf("cos")).toContain("2026-10-26");
  });

  it("still blocks the week when no target applies any more", () => {
    const schedule = withBatch({}, { targets: [] });
    expect(schedule.plannedBatches).toEqual([]);
    expect(schedule.activeBatches).toHaveLength(1);
  });

  it("projects the transplant from the actual sow date, not from the plan", () => {
    const { activeBatches } = withBatch();
    expect(activeBatches[0]).toMatchObject({
      batchId: "b1",
      sowDate: "2026-08-31",
      transplantDate: "2026-09-19", // 5 days to germinate + 14 in the nursery
      harvestDate: "2026-10-19", // 30 days on the Table
      plantsToTransplant: 84, // floor(99 * 85%)
    });
  });

  it("moves the transplant when the sow happened on a different day than planned", () => {
    const { activeBatches } = withBatch({ sowDate: "2026-09-04" });
    expect(activeBatches[0].transplantDate).toBe("2026-09-23");
  });

  it("rounds the expected transplant count down", () => {
    expect(withBatch({ sownCount: 10 }).activeBatches[0].plantsToTransplant).toBe(8); // 8.5
  });

  it("makes a Transplant Task, with no Sow Task, for the Batch", () => {
    const { tasks } = withBatch();
    const forBatch = tasks.filter((t) => t.harvestWeek === "2026-10-26");
    expect(forBatch).toEqual([
      {
        kind: "TRANSPLANT",
        varietyId: "oak",
        batchId: "b1",
        harvestWeek: "2026-10-26",
        harvestDate: "2026-10-19",
        dueDate: "2026-09-19",
        overdue: false,
        plants: 84,
      },
    ]);
  });

  it("marks the Transplant Task overdue once its day has passed", () => {
    const task = withBatch({}, { today: "2026-09-20" }).tasks.find((t) => t.kind === "TRANSPLANT");
    expect(task?.overdue).toBe(true);
  });

  it("makes no Task for a Closed Batch", () => {
    expect(withBatch({ status: "CLOSED" }).tasks.some((t) => t.kind === "TRANSPLANT")).toBe(false);
  });

  it("keeps the values copied at Sow when the Variety is edited afterwards", () => {
    const edited: VarietyInput = { ...greenOak, nurseryDays: 21, growOutDays: 40, survivalPercent: 50 };
    const { activeBatches } = withBatch({}, { varieties: [edited] });
    expect(activeBatches[0]).toMatchObject({
      transplantDate: "2026-09-19",
      harvestDate: "2026-10-19",
      plantsToTransplant: 84,
    });
  });

  it("lists Sow and Transplant Tasks together by due date", () => {
    const due = withBatch().tasks.map((t) => t.dueDate);
    expect(due).toEqual([...due].sort());
    expect(withBatch().tasks.some((t) => t.kind === "SOW")).toBe(true);
    expect(withBatch().tasks.some((t) => t.kind === "TRANSPLANT")).toBe(true);
  });
});

describe("Transplanting and Placements", () => {
  const placement = (overrides: Partial<BatchInput["placements"][number]> = {}) => ({
    id: "p1",
    tableId: "A",
    plantCount: 84,
    transplantDate: "2026-09-19",
    harvestDate: null,
    harvestKg: null,
    ...overrides,
  });
  const withBatch = (batch: Partial<BatchInput> = {}, overrides: Partial<ScheduleInput> = {}) =>
    buildSchedule(input({ batches: [{ ...sownBatch, ...batch }], ...overrides }));
  const tasksOf = (schedule: ReturnType<typeof buildSchedule>, kind: string) =>
    schedule.tasks.filter((t) => t.kind === kind && t.harvestWeek === "2026-10-26");

  it("keeps the original Transplant Task until seedlings have been moved", () => {
    expect(tasksOf(withBatch({ nurseryRemaining: null }), "TRANSPLANT")).toHaveLength(1);
  });

  it("makes no Transplant Task once every seedling has been moved or discarded", () => {
    const schedule = withBatch({ nurseryRemaining: 0, placements: [placement()] });
    expect(tasksOf(schedule, "TRANSPLANT")).toHaveLength(0);
  });

  it("makes a new Transplant Task due today for seedlings kept in the nursery", () => {
    const schedule = withBatch({ nurseryRemaining: 15, placements: [placement()] }, { today: "2026-09-30" });
    expect(tasksOf(schedule, "TRANSPLANT")).toEqual([
      expect.objectContaining({ kind: "TRANSPLANT", dueDate: "2026-09-30", overdue: false, plants: 15 }),
    ]);
  });

  it("makes one Harvest Task per unharvested Placement, due after the Grow-out", () => {
    const schedule = withBatch({
      nurseryRemaining: 0,
      placements: [placement(), placement({ id: "p2", tableId: "B", plantCount: 15, transplantDate: "2026-09-21" })],
    });
    const harvests = tasksOf(schedule, "HARVEST");
    expect(harvests).toHaveLength(2);
    expect(harvests[0]).toMatchObject({
      kind: "HARVEST",
      placementId: "p1",
      batchId: "b1",
      tableId: "A",
      dueDate: "2026-10-19", // 30 days after 2026-09-19
      harvestDate: "2026-10-19",
      overdue: false,
      plants: 84,
      expectedKg: 10.08, // 84 plants * 120 g
    });
    expect(harvests[1]).toMatchObject({ placementId: "p2", dueDate: "2026-10-21", expectedKg: 1.8 });
  });

  it("marks a Harvest Task overdue once its day has passed", () => {
    const schedule = withBatch({ nurseryRemaining: 0, placements: [placement()] }, { today: "2026-10-20" });
    expect(tasksOf(schedule, "HARVEST")[0].overdue).toBe(true);
  });

  it("makes no Harvest Task for a Placement that has been harvested", () => {
    const schedule = withBatch({
      nurseryRemaining: 0,
      placements: [placement({ harvestDate: "2026-10-19", harvestKg: 9.4 })],
    });
    expect(tasksOf(schedule, "HARVEST")).toHaveLength(0);
  });

  it("uses the Grow-out copied onto the Batch, not the Variety's current one", () => {
    const edited: VarietyInput = { ...greenOak, growOutDays: 45 };
    const schedule = withBatch({ nurseryRemaining: 0, placements: [placement()] }, { varieties: [edited] });
    expect(tasksOf(schedule, "HARVEST")[0].dueDate).toBe("2026-10-19");
  });
});
