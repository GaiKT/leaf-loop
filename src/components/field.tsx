import { DatePicker } from "@/components/date-picker";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  errors?: string[];
  hint?: string;
  suffix?: string;
  numeric?: boolean;
  decimal?: boolean;
  min?: string;
  max?: string;
  onValueChange?: (value: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
};

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  errors,
  hint,
  suffix,
  numeric,
  decimal,
  min,
  max,
  onValueChange,
  autoComplete,
  autoFocus,
}: FieldProps) {
  const errorId = `${name}-error`;

  // Dates use our own calendar sheet: the browser's date popup cannot be styled.
  if (type === "date") {
    const labelId = `${name}-label`;
    return (
      <div className="form-control block">
        <span id={labelId} className="mb-1 block text-sm font-medium">
          {label}
        </span>
        <DatePicker
          name={name}
          labelId={labelId}
          defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
          min={min}
          max={max}
          invalid={!!errors?.length}
          describedBy={errors?.length ? errorId : undefined}
          onValueChange={onValueChange}
        />
        {hint && !errors?.length && <span className="mt-1 block text-xs text-soft">{hint}</span>}
        {errors?.map((message) => (
          <span key={message} id={errorId} className="mt-1 block text-sm text-error">
            {message}
          </span>
        ))}
      </div>
    );
  }

  const input = (
    <input
      name={name}
      type={type}
      inputMode={decimal ? "decimal" : numeric ? "numeric" : undefined}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      min={min}
      max={max}
      onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
      required
      aria-invalid={errors?.length ? true : undefined}
      aria-describedby={errors?.length ? errorId : undefined}
      className={`input input-bordered h-12 ${suffix ? "min-w-0 flex-1" : "w-full"} ${errors?.length ? "input-error" : ""}`}
    />
  );

  return (
    <label className="form-control block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {suffix ? (
        <span className="flex items-center gap-2">
          {input}
          <span className="w-16 shrink-0 text-sm text-soft">{suffix}</span>
        </span>
      ) : (
        input
      )}
      {hint && !errors?.length && <span className="mt-1 block text-xs text-soft">{hint}</span>}
      {errors?.map((message) => (
        <span key={message} id={errorId} className="mt-1 block text-sm text-error">
          {message}
        </span>
      ))}
    </label>
  );
}
