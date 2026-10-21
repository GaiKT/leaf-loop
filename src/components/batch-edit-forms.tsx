"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

// Not `<form action>`: React 19 resets the form after an action, which would put the fields back to
// what was loaded and hide the correction that was just saved.
function useSubmit(action: Action) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();
  return {
    state,
    pending,
    setState,
    clear: () => setState(undefined),
    onSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(async () => {
        setState(await action(undefined, formData));
      });
    },
  };
}

function Result({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <div
      role={state.success ? "status" : "alert"}
      className={`alert alert-soft ${state.success ? "alert-success" : "alert-error"}`}
    >
      <span>{state.message}</span>
    </div>
  );
}

export function SowEditForm({
  action,
  sownCount,
  sowDate,
  today,
}: {
  action: Action;
  sownCount: number;
  sowDate: string;
  today: string;
}) {
  const { state, pending, clear, onSubmit } = useSubmit(action);
  const errors = state?.errors;

  return (
    <form onSubmit={onSubmit} onChange={clear} className="space-y-4">
      <Field
        label="เพาะกี่ต้น"
        name="sownCount"
        type="number"
        numeric
        suffix="ต้น"
        defaultValue={sownCount}
        errors={errors?.sownCount}
      />
      <Field
        label="เพาะวันที่"
        name="sowDate"
        type="date"
        max={today}
        defaultValue={sowDate}
        errors={errors?.sowDate}
      />
      <Result state={state} />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}

export type PlacementEditValues = {
  tableId: string | null;
  plantCount: number;
  transplantDate: string;
  /** Present only when the Placement has been harvested. */
  harvest: { harvestDate: string; harvestKg: number } | null;
};

export function PlacementEditForm({
  action,
  undoAction,
  tables,
  values,
  today,
  minDate,
}: {
  action: Action;
  undoAction: () => Promise<FormState>;
  tables: { id: string; name: string }[];
  values: PlacementEditValues;
  today: string;
  minDate: string;
}) {
  const { state, pending, clear, onSubmit } = useSubmit(action);
  const [undoState, setUndoState] = useState<FormState>();
  const [undoing, startUndo] = useTransition();
  const errors = state?.errors;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} onChange={clear} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">โต๊ะ</span>
          <select
            name="tableId"
            required
            defaultValue={values.tableId ?? ""}
            className={`select select-bordered h-12 w-full ${errors?.tableId ? "select-error" : ""}`}
          >
            {values.tableId === null && (
              <option value="" disabled>
                โต๊ะเดิมถูกลบแล้ว เลือกโต๊ะ
              </option>
            )}
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          {errors?.tableId?.map((m) => (
            <span key={m} className="mt-1 block text-sm text-error">
              {m}
            </span>
          ))}
        </label>
        <Field
          label="กี่ต้น"
          name="plantCount"
          type="number"
          numeric
          suffix="ต้น"
          defaultValue={values.plantCount}
          errors={errors?.plantCount}
        />
        <Field
          label="ย้ายปลูกวันที่"
          name="transplantDate"
          type="date"
          min={minDate}
          max={today}
          defaultValue={values.transplantDate}
          errors={errors?.transplantDate}
        />
        {values.harvest && (
          <>
            <Field
              label="เก็บได้กี่ กก."
              name="harvestKg"
              decimal
              suffix="กก."
              defaultValue={values.harvest.harvestKg}
              errors={errors?.harvestKg}
            />
            <Field
              label="เก็บวันที่"
              name="harvestDate"
              type="date"
              max={today}
              defaultValue={values.harvest.harvestDate}
              errors={errors?.harvestDate}
            />
          </>
        )}
        <Result state={state} />
        <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </form>

      {values.harvest && (
        <details className="collapse collapse-arrow border border-base-300">
          <summary className="collapse-title min-h-0 py-3 text-sm font-medium text-error">
            ยกเลิกการเก็บ
          </summary>
          <div className="collapse-content space-y-3">
            <p className="text-sm">
              ลบน้ำหนักและเก็บวันที่ที่บันทึกไว้ และให้ต้นผักกลับมาใช้หลุมบนโต๊ะอีกครั้ง
            </p>
            <Result state={undoState} />
            <button
              type="button"
              disabled={undoing} aria-busy={undoing}
              className="btn btn-error w-full"
              onClick={() => startUndo(async () => setUndoState(await undoAction()))}
            >
              {undoing ? "กำลังยกเลิก…" : "ยกเลิกเลย"}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
