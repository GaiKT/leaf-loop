"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, formatThaiDate, todayInBangkok, weekdayOf, type IsoDate } from "@/lib/dates";

// Weeks run Monday to Sunday, like the planning weeks in the rest of the app.
const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const monthStart = (date: IsoDate) => `${date.slice(0, 8)}01`;

function daysInMonth(date: IsoDate) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const nextMonth = (date: IsoDate) => addDays(monthStart(date), daysInMonth(date));
const prevMonth = (date: IsoDate) => monthStart(addDays(monthStart(date), -1));

const utc = (date: IsoDate) => new Date(`${date}T00:00:00Z`);
const monthTitle = (date: IsoDate) =>
  utc(date).toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = (date: IsoDate) =>
  utc(date).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * A calendar in a bottom sheet in place of the browser's own date popup, which cannot be styled.
 * It posts the date as a hidden `name` input in YYYY-MM-DD form, exactly what `<input type="date">` posted.
 */
export function DatePicker({
  name,
  labelId,
  defaultValue,
  min,
  max,
  invalid,
  describedBy,
  onValueChange,
}: {
  name: string;
  labelId: string;
  defaultValue?: string;
  min?: IsoDate;
  max?: IsoDate;
  invalid?: boolean;
  describedBy?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<IsoDate>(() => monthStart(defaultValue || "2000-01-01"));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.showModal();
    dialogRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  }, [open]);

  function show() {
    setView(monthStart(value || todayInBangkok()));
    setOpen(true);
  }

  function close() {
    dialogRef.current?.close();
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(date: IsoDate) {
    setValue(date);
    onValueChange?.(date);
    close();
  }

  const allowed = (date: IsoDate) => (!min || date >= min) && (!max || date <= max);
  const today = open ? todayInBangkok() : "";
  const first = open ? view : "";
  const blanks = open ? (weekdayOf(first) + 6) % 7 : 0;
  const count = open ? daysInMonth(first) : 0;

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-field border bg-base-100 px-4 text-left font-normal transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_oklch(47%_0.095_148/0.14)] focus-visible:outline-none ${
          invalid ? "border-error" : "border-base-300"
        }`}
      >
        <span className={value ? "" : "text-faint"}>{value ? fullDate(value) : "เลือกวัน"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-5 shrink-0 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <dialog
            ref={dialogRef}
            className="modal modal-bottom"
            aria-label="เลือกวันที่"
            onClose={() => setOpen(false)}
            onClick={(event) => event.target === event.currentTarget && close()}
          >
            <div className="modal-box mx-auto w-full max-w-md rounded-t-[2rem] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="เดือนก่อน"
                  disabled={!!min && first <= monthStart(min)}
                  onClick={() => setView(prevMonth(view))}
                  className="btn btn-ghost btn-circle"
                >
                  ‹
                </button>
                <p aria-live="polite" className="font-medium">
                  {monthTitle(first)}
                </p>
                <button
                  type="button"
                  aria-label="เดือนถัดไป"
                  disabled={!!max && first >= monthStart(max)}
                  onClick={() => setView(nextMonth(view))}
                  className="btn btn-ghost btn-circle"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-sm text-soft" aria-hidden="true">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="py-1">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: blanks }, (_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const date = addDays(first, i);
                  const selected = date === value;
                  const ok = allowed(date);
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={!ok}
                      aria-pressed={selected}
                      aria-current={date === today ? "date" : undefined}
                      aria-label={fullDate(date)}
                      onClick={() => choose(date)}
                      className={`mx-auto grid size-11 place-items-center rounded-full transition-colors duration-150 ${
                        selected
                          ? "bg-primary font-medium text-primary-content"
                          : ok
                            ? `hover:bg-base-200 ${date === today ? "text-primary ring-1 ring-primary" : ""}`
                            : "cursor-not-allowed text-faint/40"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!allowed(today)}
                  onClick={() => choose(today)}
                  className="btn btn-soft btn-primary flex-1"
                >
                  วันนี้ ({formatThaiDate(today)})
                </button>
                <button type="button" onClick={close} className="btn btn-ghost">
                  ปิด
                </button>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
