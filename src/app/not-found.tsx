import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">หาหน้านี้ไม่เจอ</h1>
      <p className="text-soft">หน้านี้อาจถูกลบไปแล้ว</p>
      <Link href="/" className="btn btn-primary btn-lg">
        กลับหน้าแรก
      </Link>
    </main>
  );
}
