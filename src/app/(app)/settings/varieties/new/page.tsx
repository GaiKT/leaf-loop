import { createVariety } from "@/app/actions/farm";
import { BackLink } from "@/components/back-link";
import { VarietyForm } from "@/components/variety-form";

export default function NewVarietyPage() {
  return (
    <section className="space-y-4">
      <BackLink href="/settings/varieties">พันธุ์ผัก</BackLink>
      <h1 className="text-2xl font-medium">เพิ่มพันธุ์ผัก</h1>
      <div className="card bg-base-100">
        <div className="card-body">
          <VarietyForm action={createVariety} submitLabel="เพิ่มพันธุ์ผัก" />
        </div>
      </div>
    </section>
  );
}
