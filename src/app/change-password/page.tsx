import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getCurrentGrower } from "@/lib/dal";

// Reads the database, so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");
  const forced = grower.mustChangePassword;

  return (
    <main className="auth-page mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-1 text-3xl font-medium">เปลี่ยนรหัสผ่าน</h1>
      <p className="mb-6 text-sm text-soft">
        {forced
          ? "ตอนนี้ใช้รหัสชั่วคราวอยู่ ตั้งรหัสใหม่ก่อนนะ"
          : `บัญชี ${grower.username}`}
      </p>
      <div className="card bg-base-100">
        <div className="card-body">
          <ChangePasswordForm />
        </div>
      </div>
      {forced ? (
        <form action={logout} className="mt-4">
          <button type="submit" className="btn btn-ghost w-full">
            <LogOut aria-hidden="true" className="size-5" />
            ออกจากระบบ
          </button>
        </form>
      ) : (
        <Link href="/settings" className="btn btn-ghost mt-4 w-full">
          กลับไปตั้งค่า
        </Link>
      )}
    </main>
  );
}
