"use client";

import { useActionState } from "react";
import { setup } from "@/app/actions/auth";
import { Field } from "@/components/field";

export function SetupForm() {
  const [state, action, pending] = useActionState(setup, undefined);
  const errors = state?.errors;

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}
      <Field
        label="ชื่อฟาร์ม"
        name="farmName"
        defaultValue={state?.values?.farmName}
        errors={errors?.farmName}
        autoFocus
      />
      <Field
        label="ชื่อผู้ใช้"
        name="username"
        defaultValue={state?.values?.username}
        errors={errors?.username}
        hint="a-z ตัวเลข . - _ เท่านั้น"
        autoComplete="username"
      />
      <Field
        label="รหัสผ่าน"
        name="password"
        type="password"
        errors={errors?.password}
        hint="อย่างน้อย 8 ตัว"
        autoComplete="new-password"
      />
      <Field
        label="ยืนยันรหัสผ่าน"
        name="confirm"
        type="password"
        errors={errors?.confirm}
        autoComplete="new-password"
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังสร้างฟาร์ม…" : "สร้างฟาร์ม"}
      </button>
    </form>
  );
}
