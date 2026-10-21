"use client";

import { useMemo, useState, useTransition } from "react";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/form-state";
import { proposePlacements } from "@/lib/placement";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;
type TableRow = { id: string; name: string; slotCount: number; free: number };

export function TransplantForm({
  action,
  maxAvailable,
  defaultAvailable,
  tables,
  today,
  minDate,
}: {
  action: Action;
  maxAvailable: number;
  defaultAvailable: number;
  tables: TableRow[];
  today: string;
  minDate: string;
}) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();
  const errors = state?.errors;

  const roomOf = useMemo(
    () => tables.map((t) => ({ id: t.id, name: t.name, freeSlots: t.free })),
    [tables],
  );
  const rowsFor = (count: number) => {
    const rows: Record<string, string> = {};
    for (const p of proposePlacements(count, roomOf).placements) rows[p.tableId] = String(p.plants);
    return rows;
  };

  const [available, setAvailable] = useState(String(defaultAvailable));
  const [rows, setRows] = useState<Record<string, string>>(() => rowsFor(defaultAvailable));
  const [leftover, setLeftover] = useState<"keep" | "discard">("keep");

  const availableNumber = /^\d+$/.test(available) ? Number(available) : 0;
  const placeOf = (id: string) => (/^\d+$/.test(rows[id] ?? "") ? Number(rows[id]) : 0);
  const placed = tables.reduce((sum, t) => sum + placeOf(t.id), 0);
  const left = availableNumber - placed;
  const overTable = tables.filter((t) => placeOf(t.id) > t.free);
  const canSubmit = availableNumber >= 1 && placed >= 1 && left >= 0 && overTable.length === 0;

  function changeAvailable(value: string) {
    setAvailable(value);
    // A new count means a new suggestion; the grower can still adjust it row by row.
    if (/^\d+$/.test(value)) setRows(rowsFor(Number(value)));
  }

  // Not `<form action>`: React 19 would reset the controlled fields after a failed save.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setState(await action(undefined, formData));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ย้ายปลูกวันนี้กี่ต้น</span>
          <span className="flex items-center gap-2">
            <input
              name="available"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={maxAvailable}
              value={available}
              onChange={(e) => changeAvailable(e.target.value)}
              className={`input input-bordered h-12 min-w-0 flex-1 ${errors?.available ? "input-error" : ""}`}
            />
            <span className="w-16 shrink-0 text-sm text-soft">ต้น</span>
          </span>
          <span className="mt-1 block text-xs text-soft">
            นับเฉพาะต้นที่แข็งแรง (ไม่เกิน {maxAvailable} ต้น)
          </span>
          {errors?.available?.map((m) => (
            <span key={m} className="mt-1 block text-sm text-error">
              {m}
            </span>
          ))}
        </label>

        <Field
          label="ย้ายปลูกวันที่"
          name="transplantDate"
          type="date"
          min={minDate}
          max={today}
          defaultValue={today}
          errors={errors?.transplantDate}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">ย้ายลงโต๊ะ</legend>
        {tables.length === 0 && (
          <p className="text-sm text-error">ยังไม่มีโต๊ะ เพิ่มโต๊ะที่ ตั้งค่า › โต๊ะ</p>
        )}
        {tables.map((table) => {
          const over = placeOf(table.id) > table.free;
          const serverError = errors?.[`place_${table.id}`];
          return (
            <label key={table.id} className="block">
              <span className="flex items-center justify-between text-sm">
                <span className="font-medium">{table.name}</span>
                <span className="text-soft">
                  ว่าง {Math.max(table.free, 0)} / {table.slotCount} หลุม
                </span>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <input
                  name={`place_${table.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={rows[table.id] ?? ""}
                  placeholder="0"
                  onChange={(e) => setRows((r) => ({ ...r, [table.id]: e.target.value }))}
                  className={`input input-bordered h-12 min-w-0 flex-1 ${over || serverError ? "input-error" : ""}`}
                />
                <span className="w-16 shrink-0 text-sm text-soft">ต้น</span>
              </span>
              {over && <span className="mt-1 block text-sm text-error">เกินหลุมว่าง</span>}
              {serverError?.map((m) => (
                <span key={m} className="mt-1 block text-sm text-error">
                  {m}
                </span>
              ))}
            </label>
          );
        })}
      </fieldset>

      <div className="rounded-box bg-base-200 p-3 text-sm">
        <p>
          ย้ายลงโต๊ะ <strong>{placed}</strong> จาก {availableNumber} ต้น
        </p>
        {left < 0 && <p className="mt-1 text-error">ย้ายเกินจำนวนต้นที่มี</p>}
      </div>

      {left > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">เหลือ {left} ต้น</legend>
          <label className="flex items-start gap-3 rounded-box border border-base-300 p-3">
            <input
              type="radio"
              name="leftover"
              value="keep"
              checked={leftover === "keep"}
              onChange={() => setLeftover("keep")}
              className="radio radio-primary mt-0.5"
            />
            <span>
              <span className="block font-medium">เก็บไว้อนุบาลต่อ</span>
              <span className="block text-sm text-soft">จะมีงานย้ายปลูกให้ทำอีก</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-box border border-base-300 p-3">
            <input
              type="radio"
              name="leftover"
              value="discard"
              checked={leftover === "discard"}
              onChange={() => setLeftover("discard")}
              className="radio radio-primary mt-0.5"
            />
            <span>
              <span className="block font-medium">ทิ้ง</span>
              <span className="block text-sm text-soft">ตัดออกจากรุ่นนี้</span>
            </span>
          </label>
        </fieldset>
      )}
      {left <= 0 && <input type="hidden" name="leftover" value="discard" />}

      <button type="submit" disabled={pending || !canSubmit} aria-busy={pending} className="btn btn-primary btn-lg w-full">
        {pending ? "กำลังบันทึก…" : "บันทึกย้ายปลูก"}
      </button>
    </form>
  );
}
