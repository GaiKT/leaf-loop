import { describe, expect, it } from "vitest";
import { proposePlacements } from "./placement";

const table = (id: string, freeSlots: number) => ({ id, name: `โต๊ะ ${id}`, freeSlots });

describe("proposePlacements", () => {
  it("puts the whole Batch on one Table when it fits", () => {
    const result = proposePlacements(84, [table("A", 120)]);
    expect(result).toEqual({ placements: [{ tableId: "A", plants: 84 }], unplaced: 0 });
  });

  it("chooses the smallest Table that still fits all of it", () => {
    const result = proposePlacements(84, [table("A", 120), table("B", 90), table("C", 200)]);
    expect(result.placements).toEqual([{ tableId: "B", plants: 84 }]);
  });

  it("prefers an exact fit", () => {
    const result = proposePlacements(84, [table("A", 90), table("B", 84)]);
    expect(result.placements).toEqual([{ tableId: "B", plants: 84 }]);
  });

  it("spreads over as few Tables as possible, fullest-free first, when none fits alone", () => {
    const result = proposePlacements(250, [table("A", 120), table("B", 90), table("C", 100)]);
    expect(result.placements).toEqual([
      { tableId: "A", plants: 120 },
      { tableId: "C", plants: 100 },
      { tableId: "B", plants: 30 },
    ]);
    expect(result.unplaced).toBe(0);
  });

  it("breaks ties by Table name so the result is the same every time", () => {
    const tables = [
      { id: "z", name: "โต๊ะ B", freeSlots: 50 },
      { id: "y", name: "โต๊ะ A", freeSlots: 50 },
    ];
    expect(proposePlacements(40, tables).placements).toEqual([{ tableId: "y", plants: 40 }]);
    expect(proposePlacements(40, [...tables].reverse()).placements).toEqual([{ tableId: "y", plants: 40 }]);
  });

  it("never puts more on a Table than it has free Slots", () => {
    const tables = [table("A", 30), table("B", 20), table("C", 25)];
    const { placements } = proposePlacements(60, tables);
    for (const placement of placements) {
      const free = tables.find((t) => t.id === placement.tableId)!.freeSlots;
      expect(placement.plants).toBeLessThanOrEqual(free);
    }
    expect(placements.reduce((sum, p) => sum + p.plants, 0)).toBe(60);
  });

  it("reports what does not fit as unplaced", () => {
    const result = proposePlacements(500, [table("A", 200), table("B", 110)]);
    expect(result.placements).toEqual([
      { tableId: "A", plants: 200 },
      { tableId: "B", plants: 110 },
    ]);
    expect(result.unplaced).toBe(190);
  });

  it("places nothing and reports everything unplaced when no Table has room", () => {
    expect(proposePlacements(50, [])).toEqual({ placements: [], unplaced: 50 });
    expect(proposePlacements(50, [table("A", 0), table("B", -5)])).toEqual({ placements: [], unplaced: 50 });
  });

  it("handles a Batch of zero plants", () => {
    expect(proposePlacements(0, [table("A", 100)])).toEqual({ placements: [], unplaced: 0 });
  });

  it("always accounts for every plant", () => {
    for (const count of [1, 17, 99, 250, 400, 1000]) {
      const result = proposePlacements(count, [table("A", 120), table("B", 90), table("C", 100)]);
      const placed = result.placements.reduce((sum, p) => sum + p.plants, 0);
      expect(placed + result.unplaced).toBe(count);
    }
  });
});
