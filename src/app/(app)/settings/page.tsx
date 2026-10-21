import { ChevronRight, KeyRound, Leaf, LogOut, Rows3, Target, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { HarvestDayForm } from "@/components/harvest-day-form";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

function Row({ href, title, detail, Icon }: { href: string; title: string; detail: string; Icon: LucideIcon }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-soft">{detail}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 text-faint" />
    </Link>
  );
}

export default async function SettingsPage() {
  const grower = await getCurrentGrower();
  if (!grower) return null; // the layout has already redirected

  const [tables, varietyCount] = await Promise.all([
    db.table.aggregate({
      where: { farmId: grower.farmId },
      _count: true,
      _sum: { slotCount: true },
    }),
    db.variety.count({ where: { farmId: grower.farmId } }),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-medium">ตั้งค่า</h1>

      <div className="card bg-base-100">
        <div className="card-body">
          <HarvestDayForm current={grower.farm.harvestWeekday} />
        </div>
      </div>

      <div className="card divide-y divide-base-300 bg-base-100">
        <Row
          Icon={Rows3}
          href="/settings/tables"
          title="โต๊ะ"
          detail={`${tables._count} โต๊ะ · ${(tables._sum.slotCount ?? 0).toLocaleString("th-TH")} หลุม`}
        />
        <Row Icon={Target} href="/settings/targets" title="เป้าผลผลิต" detail="อยากเก็บกี่ กก. ต่อสัปดาห์" />
        <Row Icon={Leaf} href="/settings/varieties" title="พันธุ์ผัก" detail={`${varietyCount} พันธุ์`} />
      </div>

      <div className="card divide-y divide-base-300 bg-base-100">
        <Row Icon={Users} href="/settings/growers" title="คนในฟาร์ม" detail={`คุณคือ ${grower.username}`} />
        <Row Icon={KeyRound} href="/change-password" title="เปลี่ยนรหัสผ่าน" detail="ตั้งรหัสใหม่" />
      </div>
      <form action={logout}>
        <button type="submit" className="btn btn-outline btn-lg w-full">
          <LogOut aria-hidden="true" className="size-5" />
          ออกจากระบบ
        </button>
      </form>
    </section>
  );
}
