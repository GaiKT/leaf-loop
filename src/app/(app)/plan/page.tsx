import Link from "next/link";
import { Meta, STEP_ICON } from "@/components/meta";
import { getCurrentGrower } from "@/lib/dal";
import { formatThaiDate, mondayOf } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount, formatKg } from "@/lib/format";
import type { WeekBatchLine, WeekPlan } from "@/lib/schedule";

const KIND = {
  PLANNED: { label: "แผน", badge: "badge-ghost" },
  ACTIVE: { label: "กำลังปลูก", badge: "badge-primary badge-soft" },
  CLOSED: { label: "เก็บแล้ว", badge: "badge-neutral badge-soft" },
} as const;

function Line({ line, name }: { line: WeekBatchLine; name: string }) {
  const kind = KIND[line.kind];
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {line.batchId ? (
            <Link href={`/batches/${line.batchId}`} className="link link-primary">
              {name}
            </Link>
          ) : (
            name
          )}
          <span className={`badge badge-sm ${kind.badge}`}>{kind.label}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-soft">
          <Meta icon={STEP_ICON.SOW} label="เพาะ">
            {formatThaiDate(line.sowDate)}
          </Meta>
          <Meta icon={STEP_ICON.TRANSPLANT} label="ย้ายปลูก">
            {formatThaiDate(line.transplantDate)}
          </Meta>
          <Meta icon={STEP_ICON.HARVEST} label={line.actual ? "เก็บเมื่อ" : "จะเก็บ"}>
            {formatThaiDate(line.harvestDate)}
          </Meta>
        </p>
      </div>
      <p className="shrink-0 font-semibold">{formatKg(line.kg)}</p>
    </li>
  );
}

export default async function PlanPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule } = await loadFarmPlan(grower.farm);
  const thisWeek = mondayOf(today);
  const names = new Map(input.varieties.map((v) => [v.id, v.name]));
  const slotsOf = new Map(schedule.slotForecast.map((s) => [s.week, s]));

  const byWeek = new Map<string, WeekPlan[]>();
  for (const row of schedule.weeks) byWeek.set(row.week, [...(byWeek.get(row.week) ?? []), row]);
  const weeks = [...byWeek.keys()].sort();

  const overWeeks = schedule.slotForecast.filter((s) => s.over);

  if (weeks.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-medium">แผนการปลูก</h1>
        <div className="card bg-base-100">
          <div className="card-body gap-3">
            <p>ยังไม่มีแผน ตั้งเป้าก่อน ระบบจะวางแผนให้</p>
            <Link href="/settings/targets" className="btn btn-primary">
              ตั้งเป้า
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const round = (n: number) => Math.round(n * 1000) / 1000;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-medium">แผนการปลูก</h1>

      {overWeeks.length > 0 && (
        <div role="alert" className="alert alert-error alert-soft items-start">
          <div>
            <p className="font-medium">หลุมไม่พอ {overWeeks.length} สัปดาห์</p>
            <p className="text-sm">
              สัปดาห์ {overWeeks.map((s) => formatThaiDate(s.week)).join(", ")} ต้องใช้หลุมเกินที่มี ลดเป้าหรือเพิ่มโต๊ะ
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {weeks.map((week) => {
          const rows = byWeek.get(week)!;
          const past = week < thisWeek;
          const current = week === thisWeek;
          const targetKg = round(rows.reduce((sum, r) => sum + r.targetKg, 0));
          const expectedKg = round(rows.reduce((sum, r) => sum + r.expectedKg, 0));
          const shortfallKg = round(rows.reduce((sum, r) => sum + r.shortfallKg, 0));
          const slots = past ? undefined : slotsOf.get(week);
          return (
            <li key={week}>
              <details
                className={`collapse collapse-arrow bg-base-100 ${slots?.over ? "border border-error" : ""}`}
                open={current}
              >
                <summary className="collapse-title min-h-0 px-4 py-3">
                  <span className="flex items-baseline justify-between gap-2 pr-6">
                    <span className="font-medium">
                      <Meta icon={STEP_ICON.HARVEST} label="เก็บเกี่ยว">
                        {formatThaiDate(rows[0].harvestDate)}
                      </Meta>
                      {current && <span className="badge badge-primary badge-sm ml-2">สัปดาห์นี้</span>}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-sm">
                      <strong>{formatKg(expectedKg)}</strong> / {formatKg(targetKg)}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-soft">
                    <span>{past ? "ได้จริง / เป้า" : "คาด / เป้า"}</span>
                    {shortfallKg > 0 && (
                      <span className="badge badge-warning badge-sm">ขาด {formatKg(shortfallKg)}</span>
                    )}
                    {slots?.over && <span className="badge badge-error badge-sm">หลุมไม่พอ</span>}
                  </span>
                </summary>
                <div className="collapse-content space-y-3 px-4">
                  {rows.map((row) => (
                    <div key={row.varietyId}>
                      <p className="text-sm font-semibold">
                        {names.get(row.varietyId)}{" "}
                        <span className="font-normal text-soft">
                          เป้า {formatKg(row.targetKg)} · {past ? "ได้" : "คาด"} {formatKg(row.expectedKg)}
                        </span>
                      </p>
                      {row.lines.length === 0 ? (
                        <p className="py-2 text-sm text-soft">ไม่มีรุ่นที่ครบเก็บสัปดาห์นี้</p>
                      ) : (
                        <ul className="divide-y divide-base-300">
                          {row.lines.map((line, i) => (
                            <Line key={`${line.batchId ?? "plan"}-${line.harvestDate}-${i}`} line={line} name={names.get(line.varietyId) ?? ""} />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {slots && (
                    <p className={`text-sm ${slots.over ? "font-medium text-error" : "text-soft"}`}>
                      ใช้หลุมสูงสุด {formatCount(slots.peak)} / {formatCount(slots.capacity)}
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
