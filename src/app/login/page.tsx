import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { getCurrentGrower, hasAnyGrower } from "@/lib/dal";

// Reads the database, so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyGrower())) redirect("/setup");
  if (await getCurrentGrower()) redirect("/");

  return (
    <main className="auth-page mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <BrandMark className="mb-4 size-14" />
      <h1 className="mb-1 text-3xl font-medium">Leaf Loop</h1>
      <p className="mb-6 text-sm text-soft">เข้ามาดูงานวันนี้กัน</p>
      <div className="card bg-base-100">
        <div className="card-body">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
