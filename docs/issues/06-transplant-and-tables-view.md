---
title: Transplant with proposed Placements, and the Tables view
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

Build the **Placement proposer** test-first. It is a pure function `proposePlacements(plantCount, tables[{id, freeSlots}]) -> {placements, unplaced}`. It uses as few **Tables** as possible: a single best-fit Table if one is big enough, otherwise the Tables with the most free Slots first, with ties broken by name. It never exceeds a Table's free Slots.

The **Transplant** Task screen shows:

- the expected seedling count (pre-filled, editable)
- the proposed **Placements**
- the current free **Slots** of every Table

The grower can change the Tables and counts before saving. Saving creates the Placements in one transaction, with a server-side check of free Slots. Seedlings that don't fit can either stay in the Nursery or be discarded:

- **Stay in the Nursery:** the Batch keeps a remaining-in-nursery count, and another Transplant Task is due today.
- **Discard:** the seedlings are dropped from the Batch.

The Tables tab lists each Table with its used and free Slots and its Placements, showing Variety, sow date and days left until the expected harvest.

## Acceptance criteria

- [x] Placement proposer unit tests cover:
  - a single best fit
  - spreading across several Tables
  - deterministic tie-breaking
  - never exceeding free Slots
  - an `unplaced` remainder
  - no free Tables
  - a zero plant count
- [x] The server rejects a Placement larger than the Table's free Slots, even if two Growers save at the same moment. (Checked with a form left open while the Table was filled behind it: the server refused and nothing was saved. Rows are locked for the whole transaction, but two saves at the exact same instant were not run.)
- [x] Seedlings kept in the Nursery produce a new Transplant Task. Discarding them closes the Transplant step.
- [x] The schedule engine projects one Harvest Task per Placement, due on the transplant date plus Grow-out days (unit tested).
- [x] The Tables view matches the Slots actually used.

## Blocked by

- 05-complete-or-skip-sow
