"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { createGrower } from "@/app/actions/growers";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";

function TemporaryPassword({ password }: { password: string }) {
  return (
    <div className="rounded-box bg-base-200 p-3 text-sm">
      <p className="mb-1 text-soft">รหัสชั่วคราว (เห็นครั้งเดียว)</p>
      <p className="select-all font-mono text-lg font-semibold tracking-wider">{password}</p>
      <p className="mt-2 text-soft">
        ส่งรหัสนี้ให้เจ้าของบัญชี เขาต้องตั้งรหัสใหม่ตอนเข้าครั้งแรก
      </p>
    </div>
  );
}

export function CreateGrowerForm() {
  const [state, action, pending] = useActionState(createGrower, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="ชื่อผู้ใช้ของคนใหม่"
        name="username"
        defaultValue={state?.success ? "" : state?.values?.username}
        errors={state?.errors?.username}
        hint="a-z ตัวเลข . - _ เท่านั้น"
        autoComplete="off"
      />
      {state?.success && state.values?.tempPassword && (
        <div role="status" className="space-y-2">
          <div className="alert alert-success alert-soft">
            <span>{state.message}</span>
          </div>
          <TemporaryPassword password={state.values.tempPassword} />
        </div>
      )}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
        {pending ? "กำลังสร้าง…" : "สร้างบัญชี"}
      </button>
    </form>
  );
}

export function GrowerActions({
  username,
  isSelf,
  resetAction,
  deleteAction,
}: {
  username: string;
  isSelf: boolean;
  resetAction: () => Promise<FormState>;
  deleteAction: () => Promise<FormState>;
}) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();

  if (isSelf) return null;

  return (
    <div className="space-y-3 pt-2">
      {state?.message && !state.values?.tempPassword && (
        <div role={state.success ? "status" : "alert"} className={`alert alert-soft ${state.success ? "alert-success" : "alert-error"}`}>
          <span>{state.message}</span>
        </div>
      )}
      {state?.values?.tempPassword && <TemporaryPassword password={state.values.tempPassword} />}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending} aria-busy={pending}
          className="btn btn-outline btn-sm"
          onClick={() => startTransition(async () => setState(await resetAction()))}
        >
          <KeyRound aria-hidden="true" className="size-4" />
          รีเซ็ตรหัส
        </button>
        <details className="dropdown">
          <summary className="btn btn-outline btn-error btn-sm">
            <Trash2 aria-hidden="true" className="size-4" />
            ลบบัญชี
          </summary>
          <div className="dropdown-content z-10 mt-2 w-64 space-y-2 rounded-box bg-base-100 p-3 shadow">
            <p className="text-sm">ลบ {username} แล้วเขาจะเข้าไม่ได้อีก</p>
            <button
              type="button"
              disabled={pending} aria-busy={pending}
              className="btn btn-error btn-sm w-full"
              onClick={() => startTransition(async () => setState(await deleteAction()))}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              ลบเลย
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
