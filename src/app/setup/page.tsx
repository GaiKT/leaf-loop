import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { SetupForm } from "@/components/setup-form";
import { hasAnyGrower } from "@/lib/dal";

// Reads the database, so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Closed for good once the first Grower exists.
  if (await hasAnyGrower()) notFound();

  return (
    <main className="auth-page mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <BrandMark className="mb-4 size-14" />
      <h1 className="mb-1 text-3xl font-medium">ตั้งค่าเริ่มต้น</h1>
      <p className="mb-6 text-sm text-soft">
        สร้างฟาร์มกับบัญชีแรก ทำได้ครั้งเดียว
      </p>
      <div className="card bg-base-100">
        <div className="card-body">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
