---
title: Complete or skip a Sow Task → Active Batch
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

Completing a **Sow** Task opens a short form. It is pre-filled with the planned count and today's date, and both can be edited, so a grower can sow more to cover an expected **Shortfall**. Saving creates an **Active Batch** for that Variety and harvest week. The Batch keeps a copy of the Variety's day counts, survival rate and grams per plant as they were at Sow.

Skipping a Sow Task creates a **Skipped Week** instead.

The schedule engine stops planning a Batch for any Variety and week that already has a real one. From an Active Batch it projects a **Transplant** Task, due on the actual sow date plus germination days plus nursery days.

## Acceptance criteria

- [x] Schedule engine unit tests:
  - An Active Batch replaces the Planned Batch for its week.
  - The Transplant due date is calculated from the actual sow date.
  - Editing the Variety does not change the dates or rates of an existing Active Batch.
- [x] A second Batch for the same Variety and week is rejected (unique constraint and a Thai error message). (Unique index confirmed in the DB, and a stale sow page returns 404. The Thai message for two Growers saving at the same instant was not triggered.)
- [x] Completing the Task with no edits takes at most two taps.
- [x] A skipped Sow Task disappears from Today, and the week appears as skipped in Harvest Target settings. (The week showed up as skipped in settings. It was not one of the cards on Today at that moment, so its disappearing from Today was not seen directly.)

## Blocked by

- 04-harvest-target-planned-batches-sow-tasks
