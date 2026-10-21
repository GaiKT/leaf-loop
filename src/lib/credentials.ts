import * as z from "zod";

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(3, { error: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" })
      .max(32, { error: "ชื่อผู้ใช้ต้องไม่เกิน 32 ตัวอักษร" })
      .regex(/^[a-z0-9._-]+$/, {
        error: "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",
      }),
  );

export const CreateGrowerSchema = z.object({ username: usernameSchema });

export const ChangePasswordSchema = z
  .object({
    current: z.string().min(1, { error: "กรุณากรอกรหัสผ่านปัจจุบัน" }),
    password: z
      .string()
      .min(8, { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" })
      .max(128, { error: "รหัสผ่านต้องไม่เกิน 128 ตัวอักษร" }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], error: "รหัสผ่านไม่ตรงกัน" })
  .refine((d) => d.password !== d.current, {
    path: ["password"],
    error: "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม",
  });

export const passwordSchema = z
  .string()
  .min(8, { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" })
  .max(128, { error: "รหัสผ่านต้องไม่เกิน 128 ตัวอักษร" });
