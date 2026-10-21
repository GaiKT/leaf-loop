"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function HarvestForm({
  action,
  expectedKg,
  today,
  minDate,
}: {
  action: Action;
  expectedKg: number;
  today: string;
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors;

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}
      <Field
        label="ชั่งได้กี่ กก."
        name="harvestKg"
        decimal
        suffix="กก."
        defaultValue={state?.values?.harvestKg ?? expectedKg}
        errors={errors?.harvestKg}
        hint="ใส่ค่าที่คาดไว้ให้แล้ว แก้ให้ตรงที่ชั่งจริง"
        autoFocus
      />
      <Field
        label="เก็บวันที่"
        name="harvestDate"
        type="date"
        min={minDate}
        max={today}
        defaultValue={state?.values?.harvestDate ?? today}
        errors={errors?.harvestDate}
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : "บันทึกเก็บเกี่ยว"}
      </button>
    </form>
  );
}
