import { ChevronRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Meter } from "@/components/meter";
import { formatKg } from "@/lib/format";
import type { WeekPlan } from "@/lib/schedule";

/** This week's expected harvest against the target, summed over every Variety. */
export function WeekSummary({ weeks }: { weeks: WeekPlan[] }) {
  const targetKg = weeks.reduce((sum, w) => sum + w.targetKg, 0);
  const expectedKg = weeks.reduce((sum, w) => sum + w.expectedKg, 0);
  const shortfallKg = weeks.reduce((sum, w) => sum + w.shortfallKg, 0);
  if (targetKg === 0 && expectedKg === 0) return null;

  const round = (n: number) => Math.round(n * 1000) / 1000;
  const percent = targetKg > 0 ? Math.min(100, (expectedKg / targetKg) * 100) : 100;

  return (
    <Link href="/plan" className="card bg-base-100">
      <div className="card-body gap-2 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm text-soft">ผักสัปดาห์นี้</h2>
          <span className="inline-flex items-center text-sm text-primary">
            ดูแผน
            <ChevronRight aria-hidden="true" className="size-4" />
          </span>
        </div>
        <p>
          <span className="text-3xl font-semibold">{formatKg(round(expectedKg))}</span>{" "}
          <span className="text-soft">
            {targetKg > 0 ? `เป้า ${formatKg(round(targetKg))}` : "สัปดาห์นี้ไม่มีเป้า"}
          </span>
        </p>
        <Meter
          value={percent}
          tone={shortfallKg > 0 ? "warning" : "primary"}
          label="ผักที่คาดว่าจะได้เทียบกับเป้า"
        />
        {shortfallKg > 0 && (
          <p role="status" className="text-sm text-warning-content">
            <span className="badge badge-warning mr-2 gap-1">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              ขาดเป้า
            </span>
            ขาดไป {formatKg(round(shortfallKg))}
          </p>
        )}
      </div>
    </Link>
  );
}
