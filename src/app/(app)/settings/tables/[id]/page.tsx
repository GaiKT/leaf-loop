import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTable, updateTable } from "@/app/actions/farm";
import { BackLink } from "@/components/back-link";
import { DeleteTableForm } from "@/components/delete-table-form";
import { TableForm } from "@/components/table-form";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function EditTablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const table = await db.table.findFirst({ where: { id, farmId: grower.farmId } });
  if (!table) notFound();

  return (
    <section className="space-y-4">
      <BackLink href="/settings/tables">โต๊ะ</BackLink>
      <h1 className="text-2xl font-medium">แก้ไขโต๊ะ</h1>
      <div className="card bg-base-100">
        <div className="card-body">
          <TableForm
            action={updateTable.bind(null, table.id)}
            initial={{ name: table.name, slotCount: table.slotCount }}
            submitLabel="บันทึก"
          />
        </div>
      </div>

      <Link href={`/tables/${table.id}`} className="btn btn-outline w-full">
        ดูว่าตอนนี้ปลูกอะไรอยู่
      </Link>

      <DeleteTableForm action={deleteTable.bind(null, table.id)} tableName={table.name} />
    </section>
  );
}
