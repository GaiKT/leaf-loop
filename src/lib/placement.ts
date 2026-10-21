export type TableRoom = { id: string; name: string; freeSlots: number };
export type ProposedPlacement = { tableId: string; plants: number };

/**
 * Suggests where to put `plantCount` seedlings, using as few Tables as possible:
 * the smallest single Table that has room for all of them, otherwise the Tables with the most free Slots
 * first. Ties go to the lower Table name so the result is always the same. Never exceeds a Table's free
 * Slots; whatever does not fit is returned as `unplaced`.
 */
export function proposePlacements(
  plantCount: number,
  tables: TableRoom[],
): { placements: ProposedPlacement[]; unplaced: number } {
  if (plantCount <= 0) return { placements: [], unplaced: 0 };

  const open = tables.filter((t) => t.freeSlots > 0);
  const byName = (a: TableRoom, b: TableRoom) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  const fitsAll = open
    .filter((t) => t.freeSlots >= plantCount)
    .sort((a, b) => a.freeSlots - b.freeSlots || byName(a, b));
  if (fitsAll.length > 0) {
    return { placements: [{ tableId: fitsAll[0].id, plants: plantCount }], unplaced: 0 };
  }

  const placements: ProposedPlacement[] = [];
  let remaining = plantCount;
  for (const table of open.sort((a, b) => b.freeSlots - a.freeSlots || byName(a, b))) {
    if (remaining === 0) break;
    const plants = Math.min(table.freeSlots, remaining);
    placements.push({ tableId: table.id, plants });
    remaining -= plants;
  }
  return { placements, unplaced: remaining };
}
