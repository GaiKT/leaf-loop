import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-primary">
      <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
      {children}
    </Link>
  );
}
