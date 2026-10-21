"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function SowForm({
  action,
  plannedCount,
  today,
}: {
  action: Action;
  plannedCount: number;
  today: string;
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
        label="เพาะจริงกี่ต้น"
        name="sownCount"
        type="number"
        numeric
        suffix="ต้น"
        defaultValue={state?.values?.sownCount ?? plannedCount}
        errors={errors?.sownCount}
        hint="เพาะมากหรือน้อยกว่าแผนก็แก้ได้"
      />
      <Field
        label="เพาะวันที่"
        name="sowDate"
        type="date"
        max={today}
        defaultValue={state?.values?.sowDate ?? today}
        errors={errors?.sowDate}
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : "บันทึกเพาะ"}
      </button>
    </form>
  );
}
