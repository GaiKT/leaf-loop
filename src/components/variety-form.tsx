"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export type VarietyValues = {
  name: string;
  germinationDays: number;
  nurseryDays: number;
  growOutDays: number;
  survivalPercent: number;
  gramsPerPlant: number;
};

export function VarietyForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: VarietyValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors;
  const value = (key: keyof VarietyValues) => state?.values?.[key] ?? initial?.[key];

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}
      <Field label="ชื่อพันธุ์" name="name" defaultValue={value("name")} errors={errors?.name} autoFocus />
      <Field
        label="เพาะงอก"
        name="germinationDays"
        type="number"
        numeric
        suffix="วัน"
        defaultValue={value("germinationDays")}
        errors={errors?.germinationDays}
      />
      <Field
        label="อนุบาล"
        name="nurseryDays"
        type="number"
        numeric
        suffix="วัน"
        defaultValue={value("nurseryDays")}
        errors={errors?.nurseryDays}
      />
      <Field
        label="บนโต๊ะ (ย้ายปลูกถึงเก็บ)"
        name="growOutDays"
        type="number"
        numeric
        suffix="วัน"
        defaultValue={value("growOutDays")}
        errors={errors?.growOutDays}
      />
      <Field
        label="รอดกี่ % (เพาะถึงย้ายปลูก)"
        name="survivalPercent"
        type="number"
        numeric
        suffix="%"
        defaultValue={value("survivalPercent")}
        errors={errors?.survivalPercent}
      />
      <Field
        label="หนักต้นละกี่กรัม"
        name="gramsPerPlant"
        type="number"
        numeric
        suffix="กรัม"
        defaultValue={value("gramsPerPlant")}
        errors={errors?.gramsPerPlant}
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : submitLabel}
      </button>
    </form>
  );
}
