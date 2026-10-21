---
title: Harvest Targets → Planned Batches → Sow Tasks (schedule engine core)
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

The first cut of the **schedule engine**: a pure `buildSchedule(input)` with no I/O, built test-first. This slice covers the rules for **Harvest Targets**, **Skipped Weeks**, **Planned Batches** and **Sow** Tasks listed in the PRD's Implementation Decisions. Planned Batches are always derived and never stored (ADR-0001).

Settings gains Harvest Target management:

- Add a target version (kg per week and an effective week) for a Variety. The effective week defaults to the earliest harvest week whose sow date is today or later.
- View the history of versions.
- Set 0 kg to stop a Variety.
- Add or remove **Skipped Weeks**.

The Today tab lists due and **Overdue** Sow Tasks (overdue ones first, in red), each showing the Variety and the number of plants to sow. Below them, it lists the Tasks coming up in the next few days.

## Acceptance criteria

- [x] Vitest unit tests for `buildSchedule` cover:
  - Harvest Day per week.
  - Back-calculated transplant and sow dates, including a Grow-out that is not a multiple of 7 and dates that cross month and year boundaries.
  - Rounding (`ceil(kg×1000/g)`, then `ceil(/survival)`).
  - Choosing the target version at an effective-week boundary.
  - A 0 kg target and a Skipped Week each producing no Batch.
  - Overdue Sow Tasks.
  - The 12-week horizon.
- [x] Tests call only the public function with plain data.
- [x] A 10 kg green oak target with the default values plans 84 plants to transplant and 99 to sow each week.
- [x] A new target never creates Tasks that are already overdue.
- [x] Today shows Sow Tasks in Thai with formatted dates, and overdue Tasks are listed first.
- [x] Nothing about Planned Batches is persisted.

## Blocked by

- 03-farm-settings-tables-varieties
