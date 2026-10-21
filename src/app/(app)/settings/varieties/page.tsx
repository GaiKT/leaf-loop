import { Plus } from "lucide-react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function VarietiesSettingsPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const varieties = await db.variety.findMany({
    where: { farmId: grower.farmId },
    orderBy: { name: "asc" },
  });

  return (
    <section className="space-y-4">
      <BackLink href="/settings">ตั้งค่า</BackLink>
      <h1 className="text-2xl font-medium">พันธุ์ผัก</h1>

      {varieties.length === 0 ? (
        <p className="text-soft">ยังไม่มีพันธุ์ผัก</p>
      ) : (
        <ul className="card divide-y divide-base-300 bg-base-100">
          {varieties.map((variety) => (
            <li key={variety.id}>
              <Link
                href={`/settings/varieties/${variety.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span>
                  <span className="block font-medium">{variety.name}</span>
                  <span className="block text-sm text-soft">
                    เพาะ {variety.germinationDays} · อนุบาล {variety.nurseryDays} · บนโต๊ะ{" "}
                    {variety.growOutDays} วัน
                  </span>
                  <span className="block text-sm text-soft">
                    รอด {variety.survivalPercent}% · {variety.gramsPerPlant} กรัม/ต้น
                  </span>
                </span>
                <span aria-hidden="true" className="text-xl opacity-40">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/settings/varieties/new" className="btn btn-primary btn-lg w-full">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
        เพิ่มพันธุ์ผัก
      </Link>
    </section>
  );
}
