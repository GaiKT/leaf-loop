const TONES = {
  primary: "bg-primary",
  warning: "bg-warning",
  error: "bg-error",
} as const;

/** A rounded bar that grows in from the left. `value` is clamped to 0..max. */
export function Meter({
  value,
  max = 100,
  tone = "primary",
  label,
}: {
  value: number;
  max?: number;
  tone?: keyof typeof TONES;
  label: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(max, Math.max(0, value))}
      className="h-2.5 w-full overflow-hidden rounded-full bg-base-300/70"
    >
      <div
        className={`h-full origin-left animate-grow rounded-full ${TONES[tone]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
