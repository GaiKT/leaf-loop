import { describe, expect, it } from "vitest";
import type { BatchInput } from "./schedule";
import { seedlingsOn } from "./seedlings";

// Green oak: 5 days to germinate + 14 in the nursery, so a Batch sown on 2026-09-01 is in the nursery from
// 2026-09-06 and is due to be transplanted on 2026-09-20.
const batch = (overrides: Partial<BatchInput> = {}): BatchInput => ({
  id: "b1",
  varietyId: "oak",
  harvestWeek: "2026-10-19",
  sowDate: "2026-09-01",
  sownCount: 50,
  status: "ACTIVE",
  nurseryRemaining: null,
  placements: [],
  germinationDays: 5,
  nurseryDays: 14,
  growOutDays: 30,
  survivalPercent: 85,
  gramsPerPlant: 120,
  ...overrides,
});

describe("seedlingsOn", () => {
  it("puts a freshly sown Batch in the germination tray with its sown count", () => {
    const [seedling] = seedlingsOn([batch()], "2026-09-02");
    expect(seedling).toMatchObject({
      batchId: "b1",
      stage: "GERMINATION",
      plants: 50,
      // 85% of 50, rounded down
      expectedPlants: 42,
      nurseryFrom: "2026-09-06",
      transplantDate: "2026-09-20",
      late: false,
    });
  });

  it("moves it to the nursery on the day germination ends", () => {
    expect(seedlingsOn([batch()], "2026-09-05")[0].stage).toBe("GERMINATION");
    expect(seedlingsOn([batch()], "2026-09-06")[0].stage).toBe("NURSERY");
  });

  it("keeps a Batch in the nursery past its transplant date and marks it late", () => {
    const [seedling] = seedlingsOn([batch()], "2026-09-25");
    expect(seedling.stage).toBe("NURSERY");
    expect(seedling.late).toBe(true);
    expect(seedlingsOn([batch()], "2026-09-20")[0].late).toBe(false);
  });

  it("counts only the seedlings kept after a partial transplant", () => {
    const [seedling] = seedlingsOn([batch({ nurseryRemaining: 10 })], "2026-09-21");
    expect(seedling).toMatchObject({ stage: "NURSERY", plants: 10, expectedPlants: 10, kept: true });
  });

  it("leaves out Batches with nothing left to move and Closed Batches", () => {
    const all = [
      batch({ id: "moved", nurseryRemaining: 0 }),
      batch({ id: "closed", status: "CLOSED", nurseryRemaining: 0 }),
      batch({ id: "closed-null", status: "CLOSED" }),
    ];
    expect(seedlingsOn(all, "2026-09-10")).toEqual([]);
  });

  it("lists the oldest sowing first", () => {
    const ids = seedlingsOn(
      [batch({ id: "new", sowDate: "2026-09-08" }), batch({ id: "old", sowDate: "2026-09-01" })],
      "2026-09-10",
    ).map((s) => s.batchId);
    expect(ids).toEqual(["old", "new"]);
  });
});
