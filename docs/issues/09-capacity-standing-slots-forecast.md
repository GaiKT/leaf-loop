---
title: Capacity check — Standing Slots, max supportable kg, slot forecast
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

**Standing Slots** for a target = plants to transplant per week × ceil(Grow-out days ÷ 7).

When a grower saves a Harvest Target, the form shows two things:

- the Standing Slots for that target, plus the farm's total across all targets, against **Farm Capacity**
- the maximum kg per week the farm could support for this Variety, after the other targets take their Slots

If the total goes over capacity, the form shows a red warning. Saving is still allowed.

The schedule engine also forecasts Slot occupancy on each day, counting Active Placements and projected transplants. The Plan view flags any week where the projected Slots exceed capacity.

## Acceptance criteria

- [x] Unit tests:
  - With the default green oak values, 10 kg per week needs 420 Standing Slots.
  - The maximum supportable kg is calculated correctly, both with several targets and with a single one.
  - The forecast flags a week in which the projected Slots exceed capacity.
- [x] The warning appears without blocking the save.
- [x] The Plan view shows flagged weeks clearly.

## Blocked by

- 04-harvest-target-planned-batches-sow-tasks
- 06-transplant-and-tables-view
