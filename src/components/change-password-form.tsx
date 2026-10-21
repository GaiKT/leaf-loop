"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/growers";
import { Field } from "@/components/field";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const errors = state?.errors;

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}
      <Field
        label="รหัสผ่านปัจจุบัน"
        name="current"
        type="password"
        errors={errors?.current}
        autoComplete="current-password"
        autoFocus
      />
      <Field
        label="รหัสผ่านใหม่"
        name="password"
        type="password"
        errors={errors?.password}
        hint="อย่างน้อย 8 ตัว"
        autoComplete="new-password"
      />
      <Field
        label="ยืนยันรหัสผ่านใหม่"
        name="confirm"
        type="password"
        errors={errors?.confirm}
        autoComplete="new-password"
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}
