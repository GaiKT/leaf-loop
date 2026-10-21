import { Plus } from "lucide-react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function TablesSettingsPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const tables = await db.table.findMany({
    where: { farmId: grower.farmId },
    orderBy: { name: "asc" },
  });
  const capacity = tables.reduce((sum, table) => sum + table.slotCount, 0);

  return (
    <section className="space-y-4">
      <BackLink href="/settings">ตั้งค่า</BackLink>
      <h1 className="text-2xl font-medium">โต๊ะ</h1>

      <div className="stats w-full bg-base-100">
        <div className="stat">
          <div className="stat-title">หลุมทั้งฟาร์ม</div>
          <div className="stat-value text-primary">{capacity.toLocaleString("th-TH")}</div>
          <div className="stat-desc">หลุม จาก {tables.length} โต๊ะ</div>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="text-soft">ยังไม่มีโต๊ะ</p>
      ) : (
        <ul className="card divide-y divide-base-300 bg-base-100">
          {tables.map((table) => (
            <li key={table.id}>
              <Link
                href={`/settings/tables/${table.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span className="font-medium">{table.name}</span>
                <span className="text-sm text-soft">
                  {table.slotCount.toLocaleString("th-TH")} หลุม
                  <span aria-hidden="true" className="ml-2 text-xl opacity-40">
                    ›
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/settings/tables/new" className="btn btn-primary btn-lg w-full">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
        เพิ่มโต๊ะ
      </Link>
    </section>
  );
}
