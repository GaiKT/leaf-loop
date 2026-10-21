import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { NavProgress } from "@/components/nav-progress";
import { TabBar } from "@/components/tab-bar";
import { getCurrentGrower, hasAnyGrower } from "@/lib/dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const grower = await getCurrentGrower();
  if (!grower) redirect((await hasAnyGrower()) ? "/login" : "/setup");
  // A temporary password has to be replaced before anything else can be used.
  if (grower.mustChangePassword) redirect("/change-password");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <NavProgress />
      <header className="sticky top-0 z-10 px-3 pt-3">
        <div className="relative flex items-center gap-3 overflow-hidden rounded-full border border-base-300/70 bg-base-100/85 py-2 pl-2 pr-2 shadow-[0_10px_26px_-16px_oklch(40%_0.06_145/0.35)] backdrop-blur-md">
          {/* A soft sage blob in the corner, the only decoration. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-10 size-24 rounded-full bg-secondary/40 blur-xl"
          />
          <BrandMark className="relative size-10" />
          <div className="relative min-w-0 flex-1 leading-tight">
            <p className="text-xs text-soft">Leaf Loop</p>
            <p className="truncate font-medium">{grower.farm.name}</p>
          </div>
          <Link
            href="/settings"
            aria-label={`บัญชี ${grower.username}`}
            className="relative grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-medium uppercase text-secondary-content transition-transform active:scale-95"
          >
            {grower.username.slice(0, 1)}
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 pb-32 pt-5">{children}</main>
      <TabBar />
    </div>
  );
}
