import { Scissors, Shovel, Sprout, type LucideIcon } from "lucide-react";

/** One icon per step of a crop, used wherever the app would otherwise write the step's name. */
export const STEP_ICON = {
  SOW: Sprout,
  TRANSPLANT: Shovel,
  HARVEST: Scissors,
} as const satisfies Record<string, LucideIcon>;

/**
 * An icon followed by a short value, e.g. a sprout and a date. The icon is decoration for sighted users;
 * `label` is what a screen reader reads in its place.
 */
export function Meta({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: LucideIcon;
  label?: string;
  tone?: "error";
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${tone === "error" ? "text-error" : ""}`}>
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
      {label && <span className="sr-only">{label}</span>}
      {children}
    </span>
  );
}
