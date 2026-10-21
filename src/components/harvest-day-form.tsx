"use client";

import { useState, useTransition } from "react";
import { updateHarvestDay } from "@/app/actions/farm";
import type { FormState } from "@/lib/form-state";
import { WEEKDAYS } from "@/lib/schemas";

export function HarvestDayForm({ current }: { current: number }) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();

  // Not `<form action>`: React 19 resets the form after an action, which snaps a <select> back to the
  // option it was first rendered with and hides the value that was just saved.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setState(await updateHarvestDay(undefined, formData));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">เก็บผักวันไหน</span>
        <select
          name="harvestWeekday"
          defaultValue={current}
          onChange={() => setState(undefined)}
          className="select select-bordered h-12 w-full"
        >
          {WEEKDAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-soft">
          ทุกพันธุ์จะวางแผนให้ครบเก็บวันนี้
        </span>
      </label>
      {state?.errors?.harvestWeekday?.map((message) => (
        <p key={message} className="text-sm text-error">
          {message}
        </p>
      ))}
      {state?.message && (
        <div role="status" className="alert alert-success alert-soft">
          <span>{state.message}</span>
        </div>
      )}
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full">
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
