import { ChevronRight, LayoutGrid, Leaf, Rows3 } from "lucide-react";
import Link from "next/link";
import { Meter } from "@/components/meter";
import { formatCount } from "@/lib/format";

const STAGES = [
  { key: "tray", label: "ถาดเพาะ", Icon: LayoutGrid },
  { key: "nursery", label: "อนุบาล", Icon: Leaf },
  { key: "tables", label: "บนโต๊ะ", Icon: Rows3 },
] as const;

/** Where every plant on the farm is right now: sowing tray, nursery, or on a Table, plus how full the Tables are. */
export function FarmOverview({
  inTray,
  inNursery,
  onTables,
  slotCapacity,
}: {
  inTray: number;
  inNursery: number;
  onTables: number;
  slotCapacity: number;
}) {
  const counts = { tray: inTray, nursery: inNursery, tables: onTables };
  const free = slotCapacity - onTables;

  return (
    <Link href="/tables" className="card bg-base-100">
      <div className="card-body gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm text-soft">ภาพรวมฟาร์ม</h2>
          <ChevronRight aria-label="ดูทั้งหมด" className="size-5 text-primary" />
        </div>

        <ul className="grid grid-cols-3 gap-2">
          {STAGES.map(({ key, label, Icon }) => (
            <li key={key} className="rounded-box bg-base-200/60 p-3">
              <Icon aria-hidden="true" className="size-5 text-primary" strokeWidth={1.8} />
              <p className="mt-1 text-2xl font-semibold leading-tight">{formatCount(counts[key])}</p>
              <p className="text-sm text-soft">{label}</p>
            </li>
          ))}
        </ul>

        {slotCapacity > 0 && (
          <div className="space-y-1.5">
            <Meter
              value={onTables}
              max={slotCapacity}
              tone={free < 0 ? "error" : "primary"}
              label={`หลุมที่ใช้ ${onTables} จาก ${slotCapacity}`}
            />
            <p className="text-sm text-soft">
              {free < 0
                ? `หลุมเกิน ${formatCount(-free)}`
                : `หลุมว่าง ${formatCount(free)} จาก ${formatCount(slotCapacity)}`}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
