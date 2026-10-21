---
title: Harvest each Placement and close Batches
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

Each **Harvest** Task covers one **Placement**. It shows the Table, the Batch and the expected kg. Completing it records the actual date and the kg weighed. This frees the Placement's **Slots** immediately, so another Batch can be transplanted onto that Table the same day. Placements of one Batch can be harvested on different days.

A Batch becomes a **Closed Batch** once every Placement is harvested and no seedlings remain in the Nursery. Closed Batches leave the Today and Tables lists.

## Acceptance criteria

- [x] Completing a Harvest Task requires a kg value greater than 0.
- [x] Freed Slots show up straight away in the Tables view and in the next Transplant proposal.
- [x] A Batch with one Placement harvested and one still growing stays Active. Once both are harvested, it becomes Closed.
- [x] A Batch with seedlings still in the Nursery does not close.
- [x] Unit test: Slots freed on a Harvest Day are available to a Transplant on the same day.

## Blocked by

- 06-transplant-and-tables-view
