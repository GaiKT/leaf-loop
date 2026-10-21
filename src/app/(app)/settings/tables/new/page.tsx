import { createTable } from "@/app/actions/farm";
import { BackLink } from "@/components/back-link";
import { TableForm } from "@/components/table-form";

export default function NewTablePage() {
  return (
    <section className="space-y-4">
      <BackLink href="/settings/tables">โต๊ะ</BackLink>
      <h1 className="text-2xl font-medium">เพิ่มโต๊ะ</h1>
      <div className="card bg-base-100">
        <div className="card-body">
          <TableForm action={createTable} submitLabel="เพิ่มโต๊ะ" />
        </div>
      </div>
    </section>
  );
}
