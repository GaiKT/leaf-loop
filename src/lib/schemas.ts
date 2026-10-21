import * as z from "zod";
import { isIsoDate, weekdayOf } from "./dates";

const wholeNumber = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `กรุณากรอก${label}เป็นตัวเลข` })
    .int({ error: `${label}ต้องเป็นจำนวนเต็ม` })
    .min(min, { error: `${label}ต้องไม่น้อยกว่า ${min}` })
    .max(max, { error: `${label}ต้องไม่เกิน ${max}` });

// A real calendar date that is a Monday, which is how every week is identified.
const mondayDate = z
  .string()
  .refine(isIsoDate, { error: "วันที่ไม่ถูกต้อง" })
  .refine((date) => !isIsoDate(date) || weekdayOf(date) === 1, {
    error: "ต้องเลือกสัปดาห์ที่เริ่มวันจันทร์",
  });

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `กรุณากรอก${label}` })
    .max(50, { error: `${label}ต้องไม่เกิน 50 ตัวอักษร` });

export const TableSchema = z.object({
  name: name("ชื่อโต๊ะ"),
  slotCount: wholeNumber("จำนวนหลุม", 1, 10000),
});

export const VarietySchema = z.object({
  name: name("ชื่อพันธุ์"),
  germinationDays: wholeNumber("จำนวนวันเพาะงอก", 1, 365),
  nurseryDays: wholeNumber("จำนวนวันอนุบาล", 1, 365),
  growOutDays: wholeNumber("จำนวนวันบนโต๊ะปลูก", 1, 365),
  survivalPercent: wholeNumber("อัตรารอด", 1, 100),
  gramsPerPlant: wholeNumber("น้ำหนักต่อต้น", 1, 5000),
});

export const TargetSchema = z.object({
  // Piped from a trimmed string so a blank field is an error, not 0 kg (which would stop the Variety).
  kgPerWeek: z
    .string()
    .trim()
    .min(1, { error: "กรุณากรอกปริมาณเป้าหมาย" })
    .regex(/^-?\d+(\.\d+)?$/, { error: "กรุณากรอกปริมาณเป็นตัวเลข" })
    .transform(Number)
    .pipe(
      z
        .number()
        .min(0, { error: "ปริมาณต้องไม่น้อยกว่า 0" })
        .max(10000, { error: "ปริมาณต้องไม่เกิน 10,000 กิโลกรัม" })
        .refine((kg) => Math.abs(kg * 1000 - Math.round(kg * 1000)) < 1e-6, {
          error: "ใส่ทศนิยมได้ไม่เกิน 3 ตำแหน่ง",
        }),
    ),
  effectiveWeek: mondayDate,
});

export const WeekSchema = z.object({ week: mondayDate });

export const SowSchema = z.object({
  sownCount: wholeNumber("จำนวนที่เพาะ", 1, 100000),
  sowDate: z.string().refine(isIsoDate, { error: "วันที่ไม่ถูกต้อง" }),
});

export const TransplantSchema = z.object({
  available: wholeNumber("จำนวนต้นกล้าที่ย้ายปลูก", 1, 100000),
  transplantDate: z.string().refine(isIsoDate, { error: "วันที่ไม่ถูกต้อง" }),
  leftover: z.enum(["keep", "discard"], { error: "กรุณาเลือกว่าจะทำอย่างไรกับต้นกล้าที่เหลือ" }),
});

// Kilograms weighed at harvest: more than 0, at most 3 decimals. A blank field is an error.
const weighedKg = z
  .string()
  .trim()
  .min(1, { error: "กรุณากรอกน้ำหนักที่ชั่งได้" })
  .regex(/^\d+(\.\d+)?$/, { error: "กรุณากรอกน้ำหนักเป็นตัวเลข" })
  .transform(Number)
  .pipe(
    z
      .number()
      .gt(0, { error: "น้ำหนักต้องมากกว่า 0" })
      .max(100000, { error: "น้ำหนักต้องไม่เกิน 100,000 กิโลกรัม" })
      .refine((kg) => Math.abs(kg * 1000 - Math.round(kg * 1000)) < 1e-6, {
        error: "ใส่ทศนิยมได้ไม่เกิน 3 ตำแหน่ง",
      }),
  );

export const HarvestSchema = z.object({
  harvestKg: weighedKg,
  harvestDate: z.string().refine(isIsoDate, { error: "วันที่ไม่ถูกต้อง" }),
});

/** The fields of a Placement that can be corrected after the fact. */
export const PlacementSchema = z.object({
  tableId: z.string().min(1, { error: "กรุณาเลือกโต๊ะ" }),
  plantCount: wholeNumber("จำนวนต้น", 1, 100000),
  transplantDate: z.string().refine(isIsoDate, { error: "วันที่ไม่ถูกต้อง" }),
});

export const HarvestDaySchema = z.object({
  harvestWeekday: wholeNumber("วันเก็บเกี่ยว", 0, 6),
});

// Monday first, which is how Thai farms think of the week. Values are JS weekday numbers (0 = Sunday).
export const WEEKDAYS = [
  { value: 1, label: "วันจันทร์" },
  { value: 2, label: "วันอังคาร" },
  { value: 3, label: "วันพุธ" },
  { value: 4, label: "วันพฤหัสบดี" },
  { value: 5, label: "วันศุกร์" },
  { value: 6, label: "วันเสาร์" },
  { value: 0, label: "วันอาทิตย์" },
];
