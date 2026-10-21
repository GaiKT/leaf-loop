import { AlarmClock, CalendarDays, Check, Pencil, Rows3, Weight } from "lucide-react";
import Link from "next/link";
import { Meta, STEP_ICON } from "@/components/meta";
import { getCurrentGrower } from "@/lib/dal";
import { addDays, daysBetween, formatThaiDate, mondayOf } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { FarmOverview } from "@/components/farm-overview";
import { WeekSummary } from "@/components/week-summary";
import { formatCount, formatKg } from "@/lib/format";
import { seedlingsOn } from "@/lib/seedlings";
import type { Task } from "@/lib/schedule";

const UPCOMING_DAYS = 7;

const LABELS = { SOW: "เพาะ", TRANSPLANT: "ย้ายปลูก", HARVEST: "เก็บเกี่ยว" } as const;

function actionFor(task: Task) {
  switch (task.kind) {
    case "SOW":
      return { href: `/sow/${task.varietyId}/${task.harvestWeek}`, label: "บันทึกเพาะ" };
    case "TRANSPLANT":
      return { href: `/transplant/${task.batchId}`, label: "บันทึกย้ายปลูก" };
    case "HARVEST":
      return { href: `/harvest/${task.placementId}`, label: "บันทึกเก็บเกี่ยว" };
  }
}

function TaskCard({
  task,
  varietyName,
  today,
  tableName,
}: {
  task: Task;
  varietyName: string;
  today: string;
  tableName?: string;
}) {
  const lateDays = task.overdue ? daysBetween(task.dueDate, today) : 0;
  const action = actionFor(task);
  const StepIcon = STEP_ICON[task.kind];

  return (
    <li className={`card bg-base-100 ${task.overdue ? "border border-error" : ""}`}>
      <div className="card-body gap-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-full ${
              task.overdue ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            }`}
          >
            <StepIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {LABELS[task.kind]} {varietyName}
            </p>
            <div className="mt-0.5 space-y-0.5 text-sm text-soft">
              {task.kind === "HARVEST" ? (
                <p>
                  <Meta icon={Rows3}>{tableName}</Meta>
                </p>
              ) : (
                <p>
                  <Meta icon={STEP_ICON.HARVEST} label={task.kind === "SOW" ? "เก็บเกี่ยว" : "จะเก็บเกี่ยว"}>
                    {formatThaiDate(task.harvestDate)}
                  </Meta>
                </p>
              )}
              {task.overdue ? (
                <p className="font-medium">
                  <Meta icon={AlarmClock} tone="error" label="เลยกำหนด">
                    {lateDays} วัน
                  </Meta>
                </p>
              ) : (
                <p>
                  <Meta icon={CalendarDays} label="กำหนด">
                    {formatThaiDate(task.dueDate)}
                  </Meta>
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold leading-tight">{formatCount(task.plants)}</p>
            <p className="text-xs text-soft">{task.kind === "TRANSPLANT" ? "ต้น (คาด)" : "ต้น"}</p>
            {task.kind === "HARVEST" && (
              <p className="inline-flex items-center gap-1 text-xs text-soft">
                <Weight aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                <span className="sr-only">คาดว่าได้</span>
                {formatKg(task.expectedKg)}
              </p>
            )}
          </div>
        </div>
        <Link
          href={action.href}
          aria-label={`${action.label} ${varietyName}`}
          className={`btn w-full ${task.overdue ? "btn-error" : "btn-primary"}`}
        >
          <Check aria-hidden="true" className="size-5" strokeWidth={2.2} />
          บันทึก
        </Link>
        {task.kind !== "SOW" && (
          <Link href={`/batches/${task.batchId}`} className="link inline-flex items-center justify-center gap-1.5 text-sm">
            <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
            ดู / แก้
          </Link>
        )}
      </div>
    </li>
  );
}

function Section({
  title,
  tone,
  tasks,
  names,
  tableNames,
  today,
}: {
  title: string;
  tone?: "error";
  tasks: Task[];
  names: Map<string, string>;
  tableNames: Map<string, string>;
  today: string;
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className={`text-sm font-medium ${tone === "error" ? "text-error" : "text-soft"}`}>
        {title}
      </h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={`${task.kind}-${task.varietyId}-${task.harvestWeek}-${task.kind === "HARVEST" ? task.placementId : ""}`}
            task={task}
            varietyName={names.get(task.varietyId) ?? ""}
            tableName={task.kind === "HARVEST" ? tableNames.get(task.placementId) : undefined}
            today={today}
          />
        ))}
      </ul>
    </section>
  );
}

export default async function TodayPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input, schedule, placementTable, usage } = await loadFarmPlan(grower.farm);
  const thisWeek = mondayOf(today);
  const weekRows = schedule.weeks.filter((w) => w.week === thisWeek);
  const names = new Map(input.varieties.map((v) => [v.id, v.name]));
  const hasPlan =
    input.targets.some((t) => t.kgPerWeek > 0) || input.batches.length > 0;

  const { tasks } = schedule;
  const overdue = tasks.filter((t) => t.overdue);
  const dueToday = tasks.filter((t) => t.dueDate === today && !t.overdue);
  const upcoming = tasks.filter((t) => t.dueDate > today && t.dueDate <= addDays(today, UPCOMING_DAYS));
  const nothing = overdue.length + dueToday.length + upcoming.length === 0;
  const common = { names, tableNames: placementTable, today };
  const seedlings = seedlingsOn(input.batches, today);
  const inTray = seedlings.filter((s) => s.stage === "GERMINATION").reduce((sum, s) => sum + s.plants, 0);
  const onTables = usage.reduce((sum, table) => sum + table.used, 0);
  const inNursery = seedlings.filter((s) => s.stage === "NURSERY").reduce((sum, s) => sum + s.plants, 0);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium">วันนี้</h1>
        <p className="text-soft">{formatThaiDate(today)}</p>
      </div>

      {!hasPlan ? (
        <div className="card bg-base-100">
          <div className="card-body gap-3">
            <p>ยังไม่มีเป้า ตั้งเป้าแล้วระบบจะบอกว่าต้องเพาะเมื่อไหร่</p>
            <Link href="/settings/targets" className="btn btn-primary">
              ตั้งเป้า
            </Link>
          </div>
        </div>
      ) : (
        <>
          <WeekSummary weeks={weekRows} />
          {(seedlings.length > 0 || input.slotCapacity > 0) && (
            <FarmOverview inTray={inTray} inNursery={inNursery} onTables={onTables} slotCapacity={input.slotCapacity} />
          )}
          <Section title="เลยมาแล้ว" tone="error" tasks={overdue} {...common} />
          <Section title="ต้องทำวันนี้" tasks={dueToday} {...common} />
          <Section title={`${UPCOMING_DAYS} วันข้างหน้า`} tasks={upcoming} {...common} />
          {nothing && <p className="text-soft">ไม่มีงานวันนี้ และ {UPCOMING_DAYS} วันข้างหน้า</p>}
        </>
      )}
    </section>
  );
}
