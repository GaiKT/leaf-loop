import { notFound } from "next/navigation";
import { completeTransplant } from "@/app/actions/transplant";
import { BackLink } from "@/components/back-link";
import { TransplantForm } from "@/components/transplant-form";
import { getCurrentGrower } from "@/lib/dal";
import { formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";

export default async function TransplantPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule, usage } = await loadFarmPlan(grower.farm);
  const batch = input.batches.find((b) => b.id === batchId);
  const plan = schedule.activeBatches.find((b) => b.batchId === batchId);
  // Gone once every seedling has been moved or discarded, so there is nothing left to record.
  if (!batch || !plan || batch.nurseryRemaining === 0) notFound();

  const variety = input.varieties.find((v) => v.id === batch.varietyId);
  const maxAvailable = batch.nurseryRemaining ?? batch.sownCount;
  const defaultAvailable = batch.nurseryRemaining ?? plan.plantsToTransplant;

  return (
    <section className="space-y-4">
      <BackLink href="/">วันนี้</BackLink>
      <div>
        <h1 className="text-2xl font-medium">ย้ายปลูก {variety?.name}</h1>
        <p className="text-sm text-soft">
          เพาะ {formatThaiDate(batch.sowDate)} · {batch.sownCount} ต้น
          {batch.nurseryRemaining !== null && ` · เหลืออนุบาล ${batch.nurseryRemaining} ต้น`}
        </p>
      </div>
      <div className="card bg-base-100">
        <div className="card-body">
          <TransplantForm
            action={completeTransplant.bind(null, batchId)}
            maxAvailable={maxAvailable}
            defaultAvailable={defaultAvailable}
            tables={usage.map((u) => ({ id: u.tableId, name: u.name, slotCount: u.slotCount, free: u.free }))}
            today={today}
            minDate={batch.sowDate}
          />
        </div>
      </div>
    </section>
  );
}
