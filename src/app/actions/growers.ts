"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ChangePasswordSchema, CreateGrowerSchema } from "@/lib/credentials";
import { getCurrentGrower } from "@/lib/dal";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { generateTemporaryPassword } from "@/lib/passwords";

const BCRYPT_COST = 12;

async function requireGrower() {
  const grower = await getCurrentGrower();
  if (!grower) redirect("/login");
  return grower;
}

/**
 * Adds a Grower. The app makes the password up and shows it once to whoever is adding them, to hand over.
 * The new Grower has to replace it at their first login.
 */
export async function createGrower(_state: FormState, formData: FormData): Promise<FormState> {
  const grower = await requireGrower();
  const values = { username: String(formData.get("username") ?? "") };

  const parsed = CreateGrowerSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const tempPassword = generateTemporaryPassword();
  try {
    await db.grower.create({
      data: {
        farmId: grower.farmId,
        username: parsed.data.username,
        passwordHash: await bcrypt.hash(tempPassword, BCRYPT_COST),
        mustChangePassword: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { username: ["มีชื่อผู้ใช้นี้อยู่แล้ว"] }, values };
    }
    throw error;
  }

  revalidatePath("/settings/growers");
  return {
    success: true,
    message: `สร้างบัญชี ${parsed.data.username} แล้ว`,
    values: { username: parsed.data.username, tempPassword },
  };
}

/** Sets another Grower's password to a new temporary one, which they must replace at their next login. */
export async function resetGrowerPassword(id: string): Promise<FormState> {
  const me = await requireGrower();
  if (id === me.id) return { message: "รีเซ็ตรหัสผ่านของตัวเองไม่ได้ ใช้เมนูเปลี่ยนรหัสผ่าน" };

  const tempPassword = generateTemporaryPassword();
  const { count } = await db.grower.updateMany({
    where: { id, farmId: me.farmId },
    data: { passwordHash: await bcrypt.hash(tempPassword, BCRYPT_COST), mustChangePassword: true },
  });
  if (count === 0) return { message: "ไม่พบบัญชีนี้" };

  return { success: true, message: "รีเซ็ตรหัสผ่านแล้ว", values: { tempPassword } };
}

export async function deleteGrower(id: string): Promise<FormState> {
  const me = await requireGrower();
  if (id === me.id) return { message: "ลบบัญชีของตัวเองไม่ได้" };

  const deleted = await db.$transaction(async (tx) => {
    // Never leave the farm with nobody who can log in.
    if ((await tx.grower.count({ where: { farmId: me.farmId } })) <= 1) return "last" as const;
    const { count } = await tx.grower.deleteMany({ where: { id, farmId: me.farmId } });
    return count > 0 ? ("ok" as const) : ("missing" as const);
  });

  if (deleted === "last") return { message: "ลบบัญชีสุดท้ายของฟาร์มไม่ได้" };
  if (deleted === "missing") return { message: "ไม่พบบัญชีนี้" };

  revalidatePath("/settings/growers");
  return { success: true, message: "ลบบัญชีแล้ว" };
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const me = await requireGrower();

  const parsed = ChangePasswordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const stored = await db.grower.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (!stored || !(await bcrypt.compare(parsed.data.current, stored.passwordHash))) {
    return { errors: { current: ["รหัสผ่านปัจจุบันไม่ถูกต้อง"] } };
  }

  await db.grower.update({
    where: { id: me.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_COST),
      mustChangePassword: false,
    },
  });
  redirect("/");
}
