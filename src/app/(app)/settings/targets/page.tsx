import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { getCurrentGrower } from "@/lib/dal";
import { mondayOf } from "@/lib/dates";
import { loadFarmPlan } from "@/lib/farm-plan";
import { formatKg } from "@/lib/format";

export default async function TargetsPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const { today, input } = await loadFarmPlan(grower.farm);
  const thisWeek = mondayOf(today);

  return (
    <section className="space-y-4">
      <BackLink href="/settings">ตั้งค่า</BackLink>
      <h1 className="text-2xl font-medium">เป้าผลผลิต</h1>

      {input.varieties.length === 0 ? (
        <p className="text-soft">ยังไม่มีพันธุ์ผัก เพิ่มพันธุ์ก่อนนะ</p>
      ) : (
        <ul className="card divide-y divide-base-300 bg-base-100">
          {input.varieties.map((variety) => {
            const current = input.targets
              .filter((t) => t.varietyId === variety.id && t.effectiveWeek <= thisWeek)
              .at(-1);
            const hasLater = input.targets.some(
              (t) => t.varietyId === variety.id && t.effectiveWeek > thisWeek,
            );
            const detail =
              current && current.kgPerWeek > 0
                ? `${formatKg(current.kgPerWeek)} ต่อสัปดาห์`
                : current
                  ? "หยุดปลูก"
                  : "ยังไม่ตั้งเป้า";
            return (
              <li key={variety.id}>
                <Link
                  href={`/settings/targets/${variety.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
                >
                  <span>
                    <span className="block font-medium">{variety.name}</span>
                    <span className="block text-sm text-soft">
                      {detail}
                      {hasLater && " · มีเป้าใหม่รออยู่"}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl opacity-40">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
