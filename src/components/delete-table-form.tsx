"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";

export function DeleteTableForm({
  action,
  tableName,
}: {
  action: (state: FormState) => Promise<FormState>;
  tableName: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <details className="collapse collapse-arrow bg-base-100" open={state?.message ? true : undefined}>
      <summary className="collapse-title font-medium text-error">ลบโต๊ะนี้</summary>
      <div className="collapse-content space-y-3">
        <p className="text-sm">ลบ “{tableName}” ประวัติการปลูกยังอยู่</p>
        {state?.message && (
          <div role="alert" className="alert alert-error alert-soft">
            <span>{state.message}</span>
          </div>
        )}
        <form action={formAction}>
          <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-error w-full">
            {!pending && <Trash2 aria-hidden="true" className="size-5" />}
            {pending ? "กำลังลบ…" : "ลบเลย"}
          </button>
        </form>
      </div>
    </details>
  );
}
