import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Locks the given Tables until the transaction ends, so two Growers saving at the same moment are
 * handled one after the other and can never both take the last free Slots. Ids are locked in a fixed
 * order so two transactions cannot deadlock.
 */
export async function lockTables(tx: Tx, tableIds: string[]) {
  const ids = [...new Set(tableIds)].sort();
  if (ids.length === 0) return;
  await tx.$queryRaw`SELECT id FROM "Table" WHERE id = ANY(${ids}) ORDER BY id FOR UPDATE`;
}

/** Slots in use on each Table right now (unharvested Placements), optionally leaving one Placement out. */
export async function usedSlots(tx: Tx, tableIds: string[], exceptPlacementId?: string) {
  const rows = await tx.placement.groupBy({
    by: ["tableId"],
    where: {
      tableId: { in: tableIds },
      harvestDate: null,
      ...(exceptPlacementId ? { id: { not: exceptPlacementId } } : {}),
    },
    _sum: { plantCount: true },
  });
  return new Map(rows.map((row) => [row.tableId, row._sum.plantCount ?? 0]));
}

/** Locks one Batch row so changes to it are applied one at a time. */
export async function lockBatch(tx: Tx, batchId: string) {
  await tx.$queryRaw`SELECT id FROM "Batch" WHERE id = ${batchId} FOR UPDATE`;
}
