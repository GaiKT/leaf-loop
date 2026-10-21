"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import * as z from "zod";
import { signIn, signOut } from "@/auth";
import { passwordSchema, usernameSchema } from "@/lib/credentials";
import { db } from "@/lib/db";
import { GREEN_OAK_DEFAULTS } from "@/lib/defaults";
import type { FormState } from "@/lib/form-state";

const SETUP_LOCK_ID = 727001;

const SetupSchema = z
  .object({
    farmName: z
      .string()
      .trim()
      .min(1, { error: "กรอกชื่อฟาร์ม" })
      .max(100, { error: "ชื่อฟาร์มต้องไม่เกิน 100 ตัวอักษร" }),
    username: usernameSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    error: "รหัสผ่านไม่ตรงกัน",
  });

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { username, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      const locked = /^locked-(\d+)$/.exec((error as { code?: string }).code ?? "");
      if (locked) {
        return { message: `ใส่รหัสผิดหลายครั้ง รออีก ${locked[1]} นาทีแล้วลองใหม่`, values: { username } };
      }
      return { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", values: { username } };
    }
    throw error; // the redirect on success is thrown and must propagate
  }
}

export async function setup(_state: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    farmName: String(formData.get("farmName") ?? ""),
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const values = { farmName: raw.farmName, username: raw.username };

  const parsed = SetupSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { farmName, username, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  // The lock makes "no Grower exists yet" and the inserts one atomic step, so two simultaneous setups can't both win.
  const created = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETUP_LOCK_ID})`;
    if ((await tx.grower.count()) > 0) return false;

    const farm = await tx.farm.create({ data: { name: farmName } });
    await tx.variety.create({ data: { farmId: farm.id, ...GREEN_OAK_DEFAULTS } });
    await tx.grower.create({ data: { farmId: farm.id, username, passwordHash } });
    return true;
  });

  if (!created) redirect("/login");

  await signIn("credentials", { username, password, redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
