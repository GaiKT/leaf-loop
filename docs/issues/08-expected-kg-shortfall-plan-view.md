---
title: Expected kg vs target, Shortfall, and the 12-week Plan view
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

The schedule engine works out expected kg for each Variety and week, depending on how far each Batch has got:

| Batch state | Expected kg |
|---|---|
| **Planned Batch** | plants to transplant × g |
| Sown, not yet transplanted | floor(sown × survival) × g |
| Transplanted | plants transplanted × g |
| Harvested | actual kg |

Each amount counts towards the week its expected or actual harvest date falls in. **Shortfall** = max(0, target − expected).

The Today tab shows this week's expected kg against the target, and any Shortfall.

The Plan tab shows:

- a few past weeks, with actual kg against target
- the next 12 weeks, with expected kg against target and any Shortfall

Each week expands to show the Batches behind it, with Planned and Active visually distinct, and each Batch's sow, transplant and harvest dates.

## Acceptance criteria

- [x] Unit tests cover each expected-kg state, a Batch whose Placements fall in different weeks, and the Shortfall calculation, including 0 when the target is exceeded.
- [ ] Today shows a warning with the Shortfall in kg when the week is under target. (The Shortfall figure is covered by engine tests. The warning badge itself has not been seen on screen, because with the current rules a week only comes up short after a skipped, missed or under-sown Batch.)
- [ ] The Plan tab renders 12 future weeks at 360 px width without horizontal scrolling. (Rows stack vertically with no fixed widths and were checked at about 500 px. Not yet at 360 px.)
- [x] Past weeks use actual harvested kg.

## Blocked by

- 07-harvest-per-placement
