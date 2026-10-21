import { deleteGrower, resetGrowerPassword } from "@/app/actions/growers";
import { BackLink } from "@/components/back-link";
import { CreateGrowerForm, GrowerActions } from "@/components/grower-forms";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function GrowersPage() {
  const me = await getCurrentGrower();
  if (!me) return null;

  const growers = await db.grower.findMany({
    where: { farmId: me.farmId },
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, mustChangePassword: true },
  });

  return (
    <section className="space-y-5">
      <BackLink href="/settings">ตั้งค่า</BackLink>
      <h1 className="text-2xl font-medium">คนในฟาร์ม</h1>

      <ul className="card divide-y divide-base-300 bg-base-100">
        {growers.map((grower) => (
          <li key={grower.id} className="px-4 py-3">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {grower.username}
              {grower.id === me.id && <span className="badge badge-primary badge-soft badge-sm">คุณ</span>}
              {grower.mustChangePassword && (
                <span className="badge badge-warning badge-soft badge-sm">ยังไม่ได้เปลี่ยนรหัสผ่าน</span>
              )}
            </p>
            <GrowerActions
              username={grower.username}
              isSelf={grower.id === me.id}
              resetAction={resetGrowerPassword.bind(null, grower.id)}
              deleteAction={deleteGrower.bind(null, grower.id)}
            />
          </li>
        ))}
      </ul>

      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-base">เพิ่มคนในฟาร์ม</h2>
          <CreateGrowerForm />
        </div>
      </div>
    </section>
  );
}
