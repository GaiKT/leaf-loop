import { notFound } from "next/navigation";
import { updateVariety } from "@/app/actions/farm";
import { BackLink } from "@/components/back-link";
import { VarietyForm } from "@/components/variety-form";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";

export default async function EditVarietyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grower = await getCurrentGrower();
  if (!grower) return null;

  const variety = await db.variety.findFirst({ where: { id, farmId: grower.farmId } });
  if (!variety) notFound();

  return (
    <section className="space-y-4">
      <BackLink href="/settings/varieties">พันธุ์ผัก</BackLink>
      <h1 className="text-2xl font-medium">แก้ไขพันธุ์ผัก</h1>
      <div className="card bg-base-100">
        <div className="card-body">
          <VarietyForm
            action={updateVariety.bind(null, variety.id)}
            initial={{
              name: variety.name,
              germinationDays: variety.germinationDays,
              nurseryDays: variety.nurseryDays,
              growOutDays: variety.growOutDays,
              survivalPercent: variety.survivalPercent,
              gramsPerPlant: variety.gramsPerPlant,
            }}
            submitLabel="บันทึก"
          />
        </div>
      </div>
    </section>
  );
}
