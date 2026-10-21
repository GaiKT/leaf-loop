import { notFound } from "next/navigation";
import { editPlacement, editSow, undoHarvest } from "@/app/actions/batches";
import { BackLink } from "@/components/back-link";
import { PlacementEditForm, SowEditForm } from "@/components/batch-edit-forms";
import { getCurrentGrower } from "@/lib/dal";
import { formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount, formatKg } from "@/lib/format";

export default async function BatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, tables, placementTable } = await loadFarmPlan(grower.farm);
  const batch = input.batches.find((b) => b.id === batchId);
  if (!batch) notFound();

  const variety = input.varieties.find((v) => v.id === batch.varietyId);
  const tableChoices = tables.map((t) => ({ id: t.id, name: t.name }));

  return (
    <section className="space-y-5">
      <div>
        <BackLink href="/plan">แผน</BackLink>
        <h1 className="text-2xl font-medium">
          {variety?.name}{" "}
          <span className={`badge ${batch.status === "CLOSED" ? "badge-neutral badge-soft" : "badge-primary badge-soft"}`}>
            {batch.status === "CLOSED" ? "เก็บแล้ว" : "กำลังปลูก"}
          </span>
        </h1>
        <p className="text-sm text-soft">
          เก็บสัปดาห์ {formatThaiDate(batch.harvestWeek)}
          {batch.nurseryRemaining !== null && batch.nurseryRemaining > 0 &&
            ` · เหลืออนุบาล ${formatCount(batch.nurseryRemaining)} ต้น`}
        </p>
      </div>

      <div className="card bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title text-base">เพาะ</h2>
          <SowEditForm
            action={editSow.bind(null, batch.id)}
            sownCount={batch.sownCount}
            sowDate={batch.sowDate}
            today={today}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">ย้ายปลูกและเก็บเกี่ยว</h2>
        {batch.placements.length === 0 ? (
          <p className="text-sm text-soft">ยังไม่ย้ายปลูก</p>
        ) : (
          batch.placements.map((placement) => (
            <details key={placement.id} className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title min-h-0 px-4 py-3">
                <span className="block pr-6 font-medium">
                  {placementTable.get(placement.id)} · {formatCount(placement.plantCount)} ต้น
                </span>
                <span className="block pr-6 text-sm text-soft">
                  ย้ายปลูก {formatThaiDate(placement.transplantDate)}
                  {placement.harvestDate && placement.harvestKg !== null
                    ? ` · เก็บแล้ว ${formatKg(placement.harvestKg)}`
                    : " · ยังไม่เก็บ"}
                </span>
              </summary>
              <div className="collapse-content px-4">
                <PlacementEditForm
                  action={editPlacement.bind(null, placement.id)}
                  undoAction={undoHarvest.bind(null, placement.id)}
                  tables={tableChoices}
                  today={today}
                  minDate={batch.sowDate}
                  values={{
                    tableId: placement.tableId,
                    plantCount: placement.plantCount,
                    transplantDate: placement.transplantDate,
                    harvest:
                      placement.harvestDate && placement.harvestKg !== null
                        ? { harvestDate: placement.harvestDate, harvestKg: placement.harvestKg }
                        : null,
                  }}
                />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}
