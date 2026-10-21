"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";
import { formatCount, formatKg } from "@/lib/format";
import { maxSupportableKg, standingSlots } from "@/lib/schedule";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

type Growth = { growOutDays: number; survivalPercent: number; gramsPerPlant: number };

export function TargetForm({
  action,
  defaultKg,
  weeks,
  growth,
  capacity,
  otherStanding,
}: {
  action: Action;
  defaultKg?: number;
  weeks: { value: string; label: string }[];
  growth: Growth;
  /** Slots on all Tables. */
  capacity: number;
  /** Slots the other Varieties' targets keep occupied. */
  otherStanding: number;
}) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();
  const [kg, setKg] = useState(defaultKg === undefined ? "" : String(defaultKg));
  const errors = state?.errors;

  // Not `<form action>`: React 19 would reset the fields (and snap the week back) after a save.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setState(await action(undefined, formData));
    });
  }

  const valid = /^\d+(\.\d+)?$/.test(kg.trim());
  const kgNumber = valid ? Number(kg) : null;
  const needed = kgNumber === null ? null : standingSlots(growth, kgNumber);
  const total = needed === null ? null : otherStanding + needed;
  const over = total !== null && total > capacity;
  const room = capacity - otherStanding;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="เก็บกี่ กก. ต่อสัปดาห์"
        name="kgPerWeek"
        decimal
        suffix="กก."
        defaultValue={state?.values?.kgPerWeek ?? defaultKg}
        onValueChange={(value) => {
          setKg(value);
          setState(undefined);
        }}
        errors={errors?.kgPerWeek}
        hint="ใส่ 0 ถ้าจะหยุดปลูกพันธุ์นี้"
      />

      {needed !== null && total !== null && (
        <div
          role={over ? "alert" : "status"}
          className={`rounded-box p-3 text-sm ${over ? "bg-error/10 text-error" : "bg-base-200"}`}
        >
          <p>
            เป้านี้ใช้หลุมตลอด <strong>{formatCount(needed)}</strong> หลุม
          </p>
          <p>
            ทั้งฟาร์มใช้ <strong>{formatCount(total)}</strong> / {formatCount(capacity)} หลุม
          </p>
          {over && (
            <p className="mt-1 font-medium">
              หลุมไม่พอ ขาด {formatCount(total - capacity)} หลุม — พันธุ์นี้ไหวสูงสุดราว{" "}
              {formatKg(maxSupportableKg(growth, room))} ต่อสัปดาห์ (บันทึกได้ แต่บางสัปดาห์ต้นจะไม่มีที่ลง)
            </p>
          )}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">เริ่มตั้งแต่สัปดาห์ที่เก็บ</span>
        <select
          name="effectiveWeek"
          defaultValue={state?.values?.effectiveWeek}
          className="select select-bordered h-12 w-full"
        >
          {weeks.map((week) => (
            <option key={week.value} value={week.value}>
              {week.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-soft">เลือกได้ตั้งแต่สัปดาห์แรกที่ยังเพาะทัน</span>
        {errors?.effectiveWeek?.map((message) => (
          <span key={message} className="mt-1 block text-sm text-error">
            {message}
          </span>
        ))}
      </label>

      {state?.message && (
        <div
          role={state.success ? "status" : "alert"}
          className={`alert alert-soft ${state.success ? "alert-success" : "alert-error"}`}
        >
          <span>{state.message}</span>
        </div>
      )}

      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : "บันทึกเป้า"}
      </button>
    </form>
  );
}
