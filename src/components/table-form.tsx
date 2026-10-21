"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function TableForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: { name: string; slotCount: number };
  submitLabel: string;
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
        label="ชื่อโต๊ะ"
        name="name"
        defaultValue={state?.values?.name ?? initial?.name}
        errors={errors?.name}
        hint="เช่น โต๊ะ A"
        autoFocus
      />
      <Field
        label="จำนวนหลุม"
        name="slotCount"
        type="number"
        numeric
        suffix="หลุม"
        defaultValue={state?.values?.slotCount ?? initial?.slotCount}
        errors={errors?.slotCount}
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : submitLabel}
      </button>
    </form>
  );
}
