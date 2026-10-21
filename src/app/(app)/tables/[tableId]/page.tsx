import Link from "next/link";
import { Meta, STEP_ICON } from "@/components/meta";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Meter } from "@/components/meter";
import { getCurrentGrower } from "@/lib/dal";
import { addDays, daysBetween, formatThaiDate } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatCount, formatKg } from "@/lib/format";
import { slotsUsedOn } from "@/lib/slots";

const UPCOMING_DAYS = 21;

export default async function TableDetailPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, usage, schedule } = await loadFarmPlan(grower.farm);
  const table = usage.find((u) => u.tableId === tableId);
  if (!table) notFound();

  const varietyName = new Map(input.varieties.map((v) => [v.id, v.name]));
  const harvestTask = new Map(
    schedule.tasks.flatMap((t) => (t.kind === "HARVEST" ? [[t.placementId, t] as const] : [])),
  );

  const growing = input.batches.flatMap((batch) =>
    batch.placements
      .filter((p) => p.tableId === tableId && p.harvestDate === null)
      .map((placement) => ({ batch, placement, task: harvestTask.get(placement.id) })),
  );
  const standing = growing.map(({ placement, task }) => ({
    tableId,
    plantCount: placement.plantCount,
    harvestDate: null,
    transplantDate: placement.transplantDate,
    expectedEnd: task?.dueDate ?? addDays(today, 1),
  }));
  const emptyFrom = growing.length
    ? growing.reduce((latest, { task }) => (task && task.dueDate > latest ? task.dueDate : latest), today)
    : null;

  // Transplants still to come. Which Table they go on is only decided when the grower records them, so
  // show how much room this Table is expected to have on the day.
  const horizon = addDays(today, UPCOMING_DAYS);
  const upcoming = [
    ...schedule.tasks
      .filter((t) => t.kind === "TRANSPLANT" && t.dueDate <= horizon)
      .map((t) => ({ key: `a-${t.kind === "TRANSPLANT" ? t.batchId : ""}`, varietyId: t.varietyId, date: t.dueDate, plants: t.plants, planned: false })),
    ...schedule.plannedBatches
      .filter((b) => b.transplantDate <= horizon && b.transplantDate >= today)
      .map((b) => ({ key: `p-${b.varietyId}-${b.harvestWeek}`, varietyId: b.varietyId, date: b.transplantDate, plants: b.plantsToTransplant, planned: true })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const percent = table.slotCount > 0 ? Math.min(100, (table.used / table.slotCount) * 100) : 0;

  return (
    <section className="space-y-5">
      <div>
        <BackLink href="/tables">โต๊ะ</BackLink>
        <h1 className="text-2xl font-medium">{table.name}</h1>
      </div>

      <div className="card bg-base-100">
        <div className="card-body gap-2 p-4">
          <p className="text-sm">
            <strong>{formatCount(table.used)}</strong> / {formatCount(table.slotCount)} หลุม · ว่าง{" "}
            {formatCount(Math.max(table.free, 0))} หลุม
          </p>
          <Meter value={percent} label={`ใช้ ${table.used} จาก ${table.slotCount} หลุม`} />
          <p className="text-sm text-soft">
            {emptyFrom
              ? `ว่างทั้งโต๊ะ ${formatThaiDate(emptyFrom)}`
              : "ตอนนี้ว่างทั้งโต๊ะ"}
          </p>
          <Link href={`/settings/tables/${tableId}`} className="link text-sm">
            แก้ชื่อหรือจำนวนหลุม
          </Link>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-soft">ที่ปลูกอยู่</h2>
        {growing.length === 0 ? (
          <p className="text-soft">ยังไม่มีผักบนโต๊ะนี้</p>
        ) : (
          <ul className="space-y-2">
            {growing.map(({ batch, placement, task }) => {
              const left = task ? daysBetween(today, task.dueDate) : null;
              return (
                <li key={placement.id} className="card bg-base-100">
                  <div className="card-body gap-1 p-4">
                    <p className="font-medium">
                      <Link href={`/batches/${batch.id}`} className="link link-primary">
                        {varietyName.get(batch.varietyId)}
                      </Link>{" "}
                      · {formatCount(placement.plantCount)} ต้น
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-soft">
                      <Meta icon={STEP_ICON.SOW} label="เพาะ">
                        {formatThaiDate(batch.sowDate)}
                      </Meta>
                      <Meta icon={STEP_ICON.TRANSPLANT} label="ย้ายปลูก">
                        {formatThaiDate(placement.transplantDate)}
                      </Meta>
                    </p>
                    {task && left !== null && (
                      <p className={`text-sm ${left < 0 ? "font-medium text-error" : "text-soft"}`}>
                        {left < 0
                          ? `เลยมา ${-left} วัน`
                          : left === 0
                            ? "เก็บวันนี้"
                            : `เก็บ ${formatThaiDate(task.dueDate)} (อีก ${left} วัน)`}{" "}
                        · คาด {formatKg(task.expectedKg)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-soft">ย้ายปลูกใน {UPCOMING_DAYS} วันข้างหน้า</h2>
        {upcoming.length === 0 ? (
          <p className="text-soft">ไม่มีงานย้ายปลูก</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((item) => {
              const free = table.slotCount - slotsUsedOn(tableId, standing, item.date, today);
              return (
                <li key={item.key} className="card bg-base-100">
                  <div className="card-body gap-1 p-4">
                    <p className="font-medium">
                      {varietyName.get(item.varietyId)} · {formatCount(item.plants)} ต้น
                      {item.planned && <span className="badge badge-ghost badge-sm ml-2">แผน</span>}
                    </p>
                    <p className="text-sm text-soft">ย้ายปลูก {formatThaiDate(item.date)}</p>
                    <p className={`text-sm ${free >= item.plants ? "text-soft" : "text-warning-content"}`}>
                      วันนั้นว่าง {formatCount(Math.max(free, 0))} หลุม
                      {free < item.plants && " (ไม่พอทั้งรุ่น ต้องแบ่งโต๊ะ)"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
