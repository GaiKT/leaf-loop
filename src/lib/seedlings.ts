import { addDays, type IsoDate } from "./dates";
import type { BatchInput } from "./schedule";

export type Seedling = {
  batchId: string;
  varietyId: string;
  /** GERMINATION is the sowing tray; NURSERY is after germination, before Transplant. */
  stage: "GERMINATION" | "NURSERY";
  /** Seedlings in the tray or nursery right now: what was sown, or what was kept after a partial Transplant. */
  plants: number;
  /** How many are expected to be strong enough to transplant (the Variety's survival rate applied). */
  expectedPlants: number;
  sowDate: IsoDate;
  /** The first day in the nursery. */
  nurseryFrom: IsoDate;
  transplantDate: IsoDate;
  /** Past its transplant date and still waiting. */
  late: boolean;
  /** Left over from a partial Transplant, so already past its original schedule. */
  kept: boolean;
};

/**
 * Every Active Batch that still has seedlings in the sowing tray or the nursery on `today`, oldest sowing first.
 * A Batch whose seedlings have all been moved or discarded (nurseryRemaining 0) is not listed.
 */
export function seedlingsOn(batches: BatchInput[], today: IsoDate): Seedling[] {
  return batches
    .filter((batch) => batch.status === "ACTIVE" && batch.nurseryRemaining !== 0)
    .map((batch) => {
      const nurseryFrom = addDays(batch.sowDate, batch.germinationDays);
      const transplantDate = addDays(nurseryFrom, batch.nurseryDays);
      const kept = batch.nurseryRemaining !== null;
      const plants = batch.nurseryRemaining ?? batch.sownCount;
      return {
        batchId: batch.id,
        varietyId: batch.varietyId,
        stage: today < nurseryFrom ? ("GERMINATION" as const) : ("NURSERY" as const),
        plants,
        // Rounded down: a fraction of a seedling is not a plant to move.
        expectedPlants: kept ? plants : Math.floor((plants * batch.survivalPercent) / 100),
        sowDate: batch.sowDate,
        nurseryFrom,
        transplantDate,
        late: today > transplantDate,
        kept,
      };
    })
    .sort((a, b) => a.sowDate.localeCompare(b.sowDate) || a.batchId.localeCompare(b.batchId));
}
