---
title: Edit completed records
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

From a Batch's detail screen (reached from Today, Tables or Plan), a **Grower** can correct what was recorded:

- **Sow**: date and count
- **Placement**: date, Table and plant count
- **Harvest**: date and kg

Each edit goes through the same validation as the original Task. In particular, Slot limits apply, and an edit cannot create a second Batch for the same Variety and week. Projections recalculate straight away.

## Acceptance criteria

- [x] Each recorded value can be edited and saved, and the schedule, Tables view and Plan view update. (Tried on screen: sow count, weighed kg, transplant date, harvest date. Changing the Table of a Placement was only tried with a full Table, which was refused.)
- [x] An edit that would overfill a Table is rejected with a Thai message.
- [x] Changing a harvest date moves the kg to the correct week in the Plan view.
- [x] Clearing a harvest (undo) makes the Placement's Slots used again and reopens a Closed Batch if needed.

## Blocked by

- 07-harvest-per-placement
