---
title: Farm settings, Tables and Varieties
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

The Settings tab gets three things:

- **Harvest Day.** The farm's weekday, defaulting to Monday.
- **Tables.** Create, list and edit **Tables** (name and Slot count), with **Farm Capacity** shown as a total.
- **Varieties.** Create, list and edit **Varieties** with germination days, nursery days, Grow-out days, survival rate (%) and grams per plant. Green oak from setup is already listed.

Deleting a Table is allowed in this slice because no Placements exist yet. Slice 11 adds the guard that protects Tables in use.

## Acceptance criteria

- [x] The Harvest Day can be changed, and the change is saved.
- [x] Tables can be added and edited. The Slot count must be a positive integer. Farm Capacity equals the sum of all Slot counts.
- [x] Varieties can be added and edited. Day counts must be positive integers, survival must be between 1 and 100%, and grams per plant must be positive.
- [x] Validation errors are shown in formal Thai next to the field that caused them.
- [ ] Every screen is usable one-handed at 360 px width. (Layout uses full-width fields and 48 px targets, but not yet tried on a phone.)

## Blocked by

- 01-tracer-scaffold-setup-login
