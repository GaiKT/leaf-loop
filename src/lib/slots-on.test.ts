import { describe, expect, it } from "vitest";
import { slotsUsedOn, type StandingPlacement } from "./slots";

const placement = (overrides: Partial<StandingPlacement> = {}): StandingPlacement => ({
  tableId: "A",
  plantCount: 60,
  harvestDate: null,
  transplantDate: "2026-10-01",
  expectedEnd: "2026-10-31",
  ...overrides,
});

const today = "2026-10-21";

describe("slotsUsedOn", () => {
  it("counts a Placement from its transplant day until the day before its harvest", () => {
    const list = [placement()];
    expect(slotsUsedOn("A", list, "2026-09-30", today)).toBe(0);
    expect(slotsUsedOn("A", list, "2026-10-01", today)).toBe(60);
    expect(slotsUsedOn("A", list, "2026-10-30", today)).toBe(60);
  });

  it("frees the Slots on the harvest day itself", () => {
    expect(slotsUsedOn("A", [placement()], "2026-10-31", today)).toBe(0);
  });

  it("adds Placements that overlap and ignores other Tables", () => {
    const list = [placement(), placement({ plantCount: 20, transplantDate: "2026-10-15" }), placement({ tableId: "B" })];
    expect(slotsUsedOn("A", list, "2026-10-20", today)).toBe(80);
    expect(slotsUsedOn("B", list, "2026-10-20", today)).toBe(60);
  });

  it("ignores Placements that have already been harvested", () => {
    expect(slotsUsedOn("A", [placement({ harvestDate: "2026-10-20" })], "2026-10-22", today)).toBe(0);
  });

  it("assumes a Placement past its expected day is harvested by tomorrow", () => {
    const overdue = [placement({ expectedEnd: "2026-10-10" })];
    expect(slotsUsedOn("A", overdue, "2026-10-21", today)).toBe(60); // still there today
    expect(slotsUsedOn("A", overdue, "2026-10-22", today)).toBe(0);
  });
});
