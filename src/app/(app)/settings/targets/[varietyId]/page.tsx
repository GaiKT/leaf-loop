import { notFound } from "next/navigation";
import { saveTarget, skipWeek, unskipWeek } from "@/app/actions/targets";
import { BackLink } from "@/components/back-link";
import { TargetForm } from "@/components/target-form";
import { getCurrentGrower } from "@/lib/dal";
import { addDays, formatThaiDate, harvestDateForWeek, mondayOf } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatKg } from "@/lib/format";
import { earliestReachableHarvestWeek, standingSlots } from "@/lib/schedule";

const WEEK_CHOICES = 12;

export default async function VarietyTargetPage({
  params,
}: {
  params: Promise<{ varietyId: string }>;
}) {
  const { varietyId } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule } = await loadFarmPlan(grower.farm);
  const variety = input.varieties.find((v) => v.id === varietyId);
  if (!variety) notFound();

  const weekday = input.harvestWeekday;
  const thisWeek = mondayOf(today);
  const harvestLabel = (week: string) => formatThaiDate(harvestDateForWeek(week, weekday));

  const versions = input.targets.filter((t) => t.varietyId === varietyId); // oldest first
  const current = versions.filter((t) => t.effectiveWeek <= thisWeek).at(-1);
  const next = versions.find((t) => t.effectiveWeek > thisWeek);

  const firstWeek = earliestReachableHarvestWeek(variety, weekday, today);
  const weekChoices = Array.from({ length: WEEK_CHOICES }, (_, i) => {
    const week = addDays(firstWeek, i * 7);
    return { value: week, label: harvestLabel(week) };
  });

  const skipped = input.skippedWeeks
    .filter((s) => s.varietyId === varietyId && s.week >= thisWeek)
    .map((s) => s.week)
    .sort();
  const skippable = schedule.plannedBatches.filter((b) => b.varietyId === varietyId);

  // Slots the other Varieties keep occupied once their latest target is running.
  const latestKg = (id: string) =>
    input.targets
      .filter((t) => t.varietyId === id)
      .sort((a, b) => (a.effectiveWeek < b.effectiveWeek ? -1 : 1))
      .at(-1)?.kgPerWeek ?? 0;
  const otherStanding = input.varieties
    .filter((v) => v.id !== varietyId)
    .reduce((sum, v) => sum + standingSlots(v, latestKg(v.id)), 0);

  const cycleDays = variety.germinationDays + variety.nurseryDays + variety.growOutDays;

  return (
    <section className="space-y-6">
      <div>
        <BackLink href="/settings/targets">เป้าผลผลิต</BackLink>
        <h1 className="text-2xl font-medium">{variety.name}</h1>
        <p className="text-sm text-soft">เพาะถึงเก็บใช้ {cycleDays} วัน</p>
      </div>

      <div className="stats w-full bg-base-100">
        <div className="stat">
          <div className="stat-title">เป้าตอนนี้</div>
          <div className="stat-value text-primary text-2xl">
            {current ? (current.kgPerWeek > 0 ? formatKg(current.kgPerWeek) : "หยุดปลูก") : "ยังไม่ได้ตั้ง"}
          </div>
          {current && current.kgPerWeek > 0 && <div className="stat-desc">ต่อสัปดาห์</div>}
          {next && (
            <div className="stat-desc whitespace-normal">
              ถัดไป: {next.kgPerWeek > 0 ? formatKg(next.kgPerWeek) : "หยุดปลูก"} ตั้งแต่สัปดาห์ที่เก็บเกี่ยว{" "}
              {harvestLabel(next.effectiveWeek)}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-base">ตั้งเป้าใหม่</h2>
          <TargetForm
            action={saveTarget.bind(null, varietyId)}
            defaultKg={current?.kgPerWeek}
            weeks={weekChoices}
            growth={variety}
            capacity={input.slotCapacity}
            otherStanding={otherStanding}
          />
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title text-base">เป้าที่ผ่านมา</h2>
          {versions.length === 0 ? (
            <p className="text-sm text-soft">ยังไม่เคยตั้งเป้า</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {[...versions].reverse().map((version) => (
                <li key={version.effectiveWeek} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="block font-medium">
                      {version.kgPerWeek > 0 ? `${formatKg(version.kgPerWeek)} ต่อสัปดาห์` : "หยุดปลูก"}
                    </span>
                    <span className="block text-sm text-soft">
                      ตั้งแต่สัปดาห์ที่เก็บ {harvestLabel(version.effectiveWeek)}
                    </span>
                  </span>
                  {version === current && <span className="badge badge-primary badge-soft">ใช้อยู่</span>}
                  {version.effectiveWeek > thisWeek && (
                    <span className="badge badge-warning badge-soft">ยังไม่เริ่ม</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title text-base">ข้ามสัปดาห์</h2>
          <p className="text-sm text-soft">สัปดาห์ที่ข้ามจะไม่เพาะและไม่มีผัก เช่น ช่วงสงกรานต์</p>

          {skipped.length > 0 && (
            <ul className="divide-y divide-base-300">
              {skipped.map((week) => (
                <li key={week} className="flex items-center justify-between gap-2 py-2">
                  <span>เก็บ {harvestLabel(week)}</span>
                  <form action={unskipWeek.bind(null, varietyId, week)}>
                    <button type="submit" className="btn btn-sm btn-outline">
                      เลิกข้าม
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {skippable.length === 0 ? (
            <p className="text-sm text-soft">ยังไม่มีสัปดาห์ให้ข้าม ตั้งเป้าก่อนนะ</p>
          ) : (
            <form action={skipWeek.bind(null, varietyId)} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">ข้ามสัปดาห์ที่เก็บ</span>
                <select name="week" className="select select-bordered h-12 w-full">
                  {skippable.map((batch) => (
                    <option key={batch.harvestWeek} value={batch.harvestWeek}>
                      {harvestLabel(batch.harvestWeek)} (เพาะ {formatThaiDate(batch.sowDate)})
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-outline w-full">
                ข้ามสัปดาห์นี้
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
