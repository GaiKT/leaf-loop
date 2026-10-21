---
title: Table guards and Table detail
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

**Guards.** A **Table** cannot be:

- removed while it has unharvested **Placements**
- shrunk below the **Slots** it currently uses

**Table detail.** Opening a Table from the Tables tab shows:

- what is growing on it now
- its upcoming Transplants, both Active and projected from Planned Batches
- its upcoming Harvests

The grower can use this to plan cleaning the Table.

## Acceptance criteria

- [x] Removing a Table that is in use is refused with a Thai message.
- [x] Shrinking a Table below its used Slots is refused with a Thai message.
- [x] Removing an empty Table works. Past Placements on it keep their history.
- [x] Table detail lists upcoming Harvests with dates and expected kg.

## Blocked by

- 06-transplant-and-tables-view
