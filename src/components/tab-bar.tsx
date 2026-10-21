"use client";

import { CalendarRange, Rows3, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "วันนี้", Icon: Sun },
  { href: "/tables", label: "โต๊ะ", Icon: Rows3 },
  { href: "/plan", label: "แผน", Icon: CalendarRange },
  { href: "/settings", label: "ตั้งค่า", Icon: Settings },
];

/** Floating pill menu at the bottom. Four tabs, so every target is wide enough for a thumb. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-md gap-1 rounded-full border border-base-300/70 bg-base-100/90 p-1.5 shadow-[0_14px_32px_-14px_oklch(40%_0.06_145/0.4)] backdrop-blur-md">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs transition-colors duration-200 ${
                active ? "bg-primary/12 font-medium text-primary" : "text-soft hover:bg-base-200"
              }`}
            >
              <tab.Icon
                aria-hidden="true"
                className={`size-6 ${active ? "animate-pop" : ""}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
