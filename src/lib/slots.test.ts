import { describe, expect, it } from "vitest";
import { slotUsage } from "./slots";

const tables = [
  { id: "A", name: "โต๊ะ A", slotCount: 120 },
  { id: "B", name: "โต๊ะ B", slotCount: 90 },
];

describe("slotUsage", () => {
  it("counts the plants of unharvested Placements as used Slots", () => {
    const usage = slotUsage(tables, [
      { tableId: "A", plantCount: 84, harvestDate: null },
      { tableId: "A", plantCount: 20, harvestDate: null },
      { tableId: "B", plantCount: 10, harvestDate: null },
    ]);
    expect(usage).toEqual([
      { tableId: "A", name: "โต๊ะ A", slotCount: 120, used: 104, free: 16 },
      { tableId: "B", name: "โต๊ะ B", slotCount: 90, used: 10, free: 80 },
    ]);
  });

  it("frees the Slots of a Placement as soon as it is harvested", () => {
    const usage = slotUsage(tables, [
      { tableId: "A", plantCount: 84, harvestDate: "2026-10-26" },
      { tableId: "A", plantCount: 20, harvestDate: null },
    ]);
    expect(usage[0]).toMatchObject({ used: 20, free: 100 });
  });

  it("shows a Table with nothing on it as completely free", () => {
    expect(slotUsage(tables, [])[1]).toMatchObject({ used: 0, free: 90 });
  });

  it("ignores Placements whose Table has been removed", () => {
    const usage = slotUsage(tables, [{ tableId: null, plantCount: 50, harvestDate: null }]);
    expect(usage.every((u) => u.used === 0)).toBe(true);
  });

  it("lets free go negative so an overfull Table is visible rather than hidden", () => {
    const usage = slotUsage(tables, [{ tableId: "B", plantCount: 100, harvestDate: null }]);
    expect(usage[1]).toMatchObject({ used: 100, free: -10 });
  });
});
