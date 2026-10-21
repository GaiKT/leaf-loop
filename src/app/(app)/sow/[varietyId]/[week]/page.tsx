import { notFound } from "next/navigation";
import { completeSow, skipSow } from "@/app/actions/sow";
import { BackLink } from "@/components/back-link";
import { SowForm } from "@/components/sow-form";
import { getCurrentGrower } from "@/lib/dal";
import { formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount } from "@/lib/format";

export default async function SowPage({
  params,
}: {
  params: Promise<{ varietyId: string; week: string }>;
}) {
  const { varietyId, week } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule } = await loadFarmPlan(grower.farm);
  const variety = input.varieties.find((v) => v.id === varietyId);
  const planned = schedule.plannedBatches.find(
    (b) => b.varietyId === varietyId && b.harvestWeek === week,
  );
  // Gone once it has been sown or skipped (for instance after pressing back), so there is nothing to record.
  if (!variety || !planned) notFound();

  return (
    <section className="space-y-4">
      <BackLink href="/">วันนี้</BackLink>
      <div>
        <h1 className="text-2xl font-medium">เพาะ {variety.name}</h1>
        <p className="text-sm text-soft">
          เก็บ {formatThaiDate(planned.harvestDate)} · ควรเพาะ {formatThaiDate(planned.sowDate)}
        </p>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <SowForm
            action={completeSow.bind(null, varietyId, week)}
            plannedCount={planned.plantsToSow}
            today={today}
          />
          <p className="text-xs text-soft">
            แผน: เพาะ {formatCount(planned.plantsToSow)} ต้น ได้ย้ายปลูก {formatCount(planned.plantsToTransplant)} ต้น
          </p>
        </div>
      </div>

      <details className="collapse collapse-arrow bg-base-100">
        <summary className="collapse-title font-medium">ข้ามสัปดาห์นี้</summary>
        <div className="collapse-content space-y-3">
          <p className="text-sm">
            ข้ามสัปดาห์ที่เก็บ {formatThaiDate(planned.harvestDate)} จะไม่เพาะ และไม่มีผักสัปดาห์นั้น
            เลิกข้ามได้ที่ ตั้งค่า › เป้าผลผลิต
          </p>
          <form action={skipSow.bind(null, varietyId, week)}>
            <button type="submit" className="btn btn-outline w-full">
              ข้ามเลย
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}
