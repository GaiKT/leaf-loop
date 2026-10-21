import { addDays, type IsoDate } from "./dates";

export type TableInput = { id: string; name: string; slotCount: number };

/** A group of plants of one Batch standing on one Table. `tableId` is null once its Table was removed. */
export type PlacementUse = {
  tableId: string | null;
  plantCount: number;
  harvestDate: IsoDate | null;
};

export type TableUsage = {
  tableId: string;
  name: string;
  slotCount: number;
  used: number;
  free: number;
};

/**
 * Slots in use right now. A Placement occupies its Slots until it is harvested, and frees them the
 * moment it is, so a Table can be re-used on the day it is harvested. `free` can go negative.
 */
export function slotUsage(tables: TableInput[], placements: PlacementUse[]): TableUsage[] {
  const used = new Map<string, number>();
  for (const placement of placements) {
    if (placement.tableId === null || placement.harvestDate !== null) continue;
    used.set(placement.tableId, (used.get(placement.tableId) ?? 0) + placement.plantCount);
  }
  return tables.map((table) => {
    const inUse = used.get(table.id) ?? 0;
    return {
      tableId: table.id,
      name: table.name,
      slotCount: table.slotCount,
      used: inUse,
      free: table.slotCount - inUse,
    };
  });
}

export type StandingPlacement = PlacementUse & {
  transplantDate: IsoDate;
  /** The day the Placement is expected to be harvested. */
  expectedEnd: IsoDate;
};

/**
 * Slots in use on one Table on a given day, from when each Placement is expected to be harvested.
 * The Slots are free again on the harvest day itself. A Placement past its expected day is assumed to be
 * harvested by tomorrow, since it can only be harvested from today on.
 */
export function slotsUsedOn(
  tableId: string,
  placements: StandingPlacement[],
  date: IsoDate,
  today: IsoDate,
): number {
  const tomorrow = addDays(today, 1);
  let used = 0;
  for (const placement of placements) {
    if (placement.tableId !== tableId || placement.harvestDate !== null) continue;
    const end = placement.expectedEnd > tomorrow ? placement.expectedEnd : tomorrow;
    if (placement.transplantDate <= date && date < end) used += placement.plantCount;
  }
  return used;
}
