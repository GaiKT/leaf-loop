import { getCurrentGrower } from "@/lib/dal";
import { daysBetween, formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount } from "@/lib/format";
import { AlarmClock, Plus, Rows3, Scissors, Sprout } from "lucide-react";
import Link from "next/link";
import { Meta } from "@/components/meta";
import { Meter } from "@/components/meter";
import { SeedlingCards } from "@/components/seedling-cards";
import { seedlingsOn } from "@/lib/seedlings";

export default async function TablesPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, usage, schedule } = await loadFarmPlan(grower.farm);
  const varietyName = new Map(input.varieties.map((v) => [v.id, v.name]));
  const harvestDue = new Map(
    schedule.tasks.flatMap((t) => (t.kind === "HARVEST" ? [[t.placementId, t.dueDate] as const] : [])),
  );

  const seedlings = seedlingsOn(input.batches, today);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-medium">โต๊ะและต้นกล้า</h1>

      <SeedlingCards seedlings={seedlings} names={varietyName} today={today} />

      {seedlings.length > 0 && <h2 className="pt-1 text-sm font-medium text-soft">โต๊ะ</h2>}

      {usage.length === 0 ? (
        <div className="card bg-base-100">
          <div className="card-body gap-3">
            <p>ยังไม่มีโต๊ะ</p>
            <Link href="/settings/tables/new" className="btn btn-primary">
              <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
              เพิ่มโต๊ะ
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {usage.map((table) => {
            const growing = input.batches.flatMap((batch) =>
              batch.placements
                .filter((p) => p.tableId === table.tableId && p.harvestDate === null)
                .map((placement) => ({ batch, placement })),
            );
            const percent = table.slotCount > 0 ? Math.min(100, (table.used / table.slotCount) * 100) : 0;
            return (
              <li key={table.tableId} className="card bg-base-100">
                <div className="card-body gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">
                      <Link href={`/tables/${table.tableId}`} className="link inline-flex items-center gap-2">
                        <Rows3 aria-hidden="true" className="size-5" strokeWidth={1.8} />
                        {table.name}
                      </Link>
                    </h2>
                    <p className="text-sm">
                      <span className={table.free < 0 ? "font-semibold text-error" : "font-semibold"}>
                        {formatCount(table.used)}
                      </span>{" "}
                      / {formatCount(table.slotCount)} หลุม
                    </p>
                  </div>
                  <Meter
                    value={percent}
                    tone={table.free < 0 ? "error" : "primary"}
                    label={`ใช้ ${table.used} จาก ${table.slotCount} หลุม`}
                  />
                  <p className="text-sm text-soft">
                    {table.free < 0 ? `เกิน ${-table.free} หลุม` : `ว่าง ${formatCount(table.free)} หลุม`}
                  </p>

                  {growing.length > 0 && (
                    <ul className="divide-y divide-base-300">
                      {growing.map(({ batch, placement }) => {
                        const due = harvestDue.get(placement.id);
                        const left = due ? daysBetween(today, due) : null;
                        return (
                          <li key={placement.id} className="py-2">
                            <p className="font-medium">
                              <Link href={`/batches/${batch.id}`} className="link link-primary">
                                {varietyName.get(batch.varietyId)}
                              </Link>{" "}
                              · {formatCount(placement.plantCount)} ต้น
                            </p>
                            <p className="flex flex-wrap items-center gap-x-3 text-sm text-soft">
                              <Meta icon={Sprout} label="เพาะ">
                                {formatThaiDate(batch.sowDate)}
                              </Meta>
                              {due && left !== null && (
                                left < 0 ? (
                                  <Meta icon={AlarmClock} tone="error" label="เลยกำหนดเก็บ">
                                    {-left} วัน
                                  </Meta>
                                ) : (
                                  <Meta icon={Scissors} label="เก็บเกี่ยว">
                                    {left === 0 ? "วันนี้" : `อีก ${left} วัน (${formatThaiDate(due)})`}
                                  </Meta>
                                )
                              )}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
