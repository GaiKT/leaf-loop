import { notFound } from "next/navigation";
import { completeHarvest } from "@/app/actions/harvest";
import { BackLink } from "@/components/back-link";
import { HarvestForm } from "@/components/harvest-form";
import { getCurrentGrower } from "@/lib/dal";
import { formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount, formatKg } from "@/lib/format";

export default async function HarvestPage({ params }: { params: Promise<{ placementId: string }> }) {
  const { placementId } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule, placementTable } = await loadFarmPlan(grower.farm);
  const task = schedule.tasks.find((t) => t.kind === "HARVEST" && t.placementId === placementId);
  const placement = input.batches.flatMap((b) => b.placements).find((p) => p.id === placementId);
  // Gone once it has been harvested (for instance after pressing back), so there is nothing to record.
  if (!task || task.kind !== "HARVEST" || !placement) notFound();

  const variety = input.varieties.find((v) => v.id === task.varietyId);

  return (
    <section className="space-y-4">
      <BackLink href="/">วันนี้</BackLink>
      <div>
        <h1 className="text-2xl font-medium">เก็บเกี่ยว {variety?.name}</h1>
        <p className="text-sm text-soft">
          {placementTable.get(placementId)} · {formatCount(task.plants)} ต้น · กำหนด {formatThaiDate(task.dueDate)}
        </p>
      </div>
      <div className="card bg-base-100">
        <div className="card-body">
          <HarvestForm
            action={completeHarvest.bind(null, placementId)}
            expectedKg={task.expectedKg}
            today={today}
            minDate={placement.transplantDate}
          />
          <p className="text-xs text-soft">คาดไว้ {formatKg(task.expectedKg)}</p>
        </div>
      </div>
    </section>
  );
}
