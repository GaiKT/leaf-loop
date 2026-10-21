---
title: Planting schedule MVP
labels: [ready-for-agent]
---

# Planting schedule MVP

Domain terms in **bold** are defined in `CONTEXT.md`. Respect `docs/adr/0001-planned-batches-are-derived.md`.

## Problem Statement

A small NFT hydroponic farm grows green oak and must deliver a steady weight of lettuce every week. Today the grower plans sowing in their head or on paper. Mistakes surface weeks later: a forgotten sowing becomes an empty week, Tables fill up and seedlings have nowhere to go, or the farm sets a target that its Tables can never support. Several people work on the farm, and they all need to know what to do today.

## Solution

A Thai-language, mobile-first web app on the farm's home server, used over the farm's own network. The grower sets a **Harvest Target** in kg per week for each **Variety**. The app works backwards from the farm's **Harvest Day** to schedule one **Batch** per week. Each Batch has a sow date, a transplant date and a harvest date, and the app checks that the **Tables** have enough **Slots**.

Every **Grower** opens the app to a list of today's **Tasks** (Sow, Transplant, Harvest). Completing a Task records the real numbers. The app then shows the expected kilograms for each upcoming week against the target and flags any **Shortfall**. The app never re-plans by itself. The grower changes the plan by changing a target, skipping a week, or sowing a different count.

## User Stories

### Setup and accounts

1. As the first person to open the app, I want a one-time setup screen that creates the Farm and my account, so that I can start without touching the server.
2. As a Grower, I want the setup screen to be unavailable once any Grower exists, so that nobody can take over the farm from the network.
3. As a Grower, I want to log in with a username and password, so that only farm workers can change records.
4. As a Grower, I want to stay logged in on my phone, so that I don't type my password every time I go to the greenhouse.
5. As a Grower, I want to create an account for a new worker with a temporary password, so that they can start recording work.
6. As a new Grower, I want to be forced to change my temporary password on first login, so that only I know my password.
7. As a Grower, I want to reset another Grower's password to a temporary one, so that a worker who forgot theirs can get back in.
8. As a Grower, I want to delete the account of a worker who left, so that they can no longer log in.
9. As a Grower, I want the app to stop me from deleting the last remaining account, so that the farm is never locked out.
10. As a Grower, I want to change my own password, so that I can keep my account safe.
11. As the farm owner, I want a server-side command that resets a password, so that I can recover if every Grower forgets theirs.
12. As a Grower, I want to add the app to my phone's home screen, so that it opens like an app.

### Farm configuration

13. As a Grower, I want to set the farm's Harvest Day (a weekday), so that every Variety is scheduled to be ready on the day we harvest.
14. As a Grower, I want to add a Table with a name and Slot count, so that the app knows our growing space.
15. As a Grower, I want to edit a Table's name and Slot count, so that the app stays correct when we rebuild a table.
16. As a Grower, I want to remove a Table that has no unharvested Placements, so that old tables don't clutter the app.
17. As a Grower, I want the app to refuse to remove or shrink a Table below the Slots it currently uses, so that records stay consistent.
18. As a Grower, I want to see the total Farm Capacity, so that I know how many plants the farm can hold.
19. As a Grower, I want to add a Variety with germination days, nursery days, Grow-out days, survival rate and average harvest weight per plant, so that the app can schedule it.
20. As a Grower, I want green oak to come pre-filled with typical values (germination 5, nursery 14, Grow-out 30 days, 85% survival, 120 g per plant), so that I can start before I have measured my own numbers.
21. As a Grower, I want to edit a Variety's values, so that future plans use what I learned.
22. As a Grower, I want edits to a Variety to leave Batches that are already sown unchanged, so that the timing of crops in progress doesn't jump around.

### Harvest Targets and capacity

23. As a Grower, I want to set a Harvest Target in kg per week for a Variety, so that the app plans enough sowing.
24. As a Grower, I want a new target to default to the first harvest week that can still be reached if I sow today or later, so that the app doesn't create Tasks that are already overdue.
25. As a Grower, I want to change the target from a chosen future week (e.g. 15 kg from 17 Nov), so that earlier weeks keep their old amount.
26. As a Grower, I want to stop a Variety from a chosen week by setting its target to 0, so that I can end a crop cleanly.
27. As a Grower, I want to see the history of target amounts for each Variety, so that I understand why past weeks were planned as they were.
28. As a Grower, I want the app to show the Standing Slots a target needs when I save it, compared with Farm Capacity, so that I know immediately whether the farm can support it.
29. As a Grower, I want a red warning and the maximum kg per week the farm could support when targets exceed capacity, so that I can choose a realistic number. Saving is still allowed.
30. As a Grower, I want to mark a Skipped Week for a Variety (e.g. Songkran), so that no Batch is planned for that week.
31. As a Grower, I want to undo a Skipped Week, so that I can fix a mistake.

### Today

32. As a Grower, I want the home screen to list today's Tasks, so that I know exactly what to do when I arrive.
33. As a Grower, I want Overdue Tasks shown first in red, so that missed work isn't forgotten.
34. As a Grower, I want each Sow Task to show the Variety and how many plants to sow, so that I can prepare the sponges.
35. As a Grower, I want each Transplant Task to show which Batch and the proposed Tables with Slot counts, so that I know where to put the seedlings.
36. As a Grower, I want each Harvest Task to show the Table, the Batch and the expected kg, so that I know what to pull.
37. As a Grower, I want to see this week's expected kg against the target, with any Shortfall, so that I know whether we will meet our delivery.
38. As a Grower, I want to see the next few days' upcoming Tasks, so that I can prepare.

### Completing Tasks

39. As a Grower, I want to complete a Sow Task with the count pre-filled from the plan and editable, so that I record the real number with one tap when nothing changed.
40. As a Grower, I want to sow more than planned to make up for an expected Shortfall, so that I can recover a week without a separate feature.
41. As a Grower, I want to record the actual sow date if I sowed on a different day, so that later dates are calculated from reality.
42. As a Grower, I want to skip a Sow Task, which marks that week as a Skipped Week, so that a Task I won't do doesn't stay overdue forever.
43. As a Grower, I want to complete a Transplant Task by confirming or editing the proposed Placements (Table and plant count each), so that the record matches what I actually did.
44. As a Grower, I want the Transplant screen to show free Slots per Table right now, so that I don't place more plants than a Table holds.
45. As a Grower, I want the app to block a Placement larger than the Table's free Slots, so that Slot counts never go negative.
46. As a Grower, I want to be told how many seedlings don't fit anywhere, and choose whether to keep them in the Nursery for later or discard them, so that I decide what happens to the surplus.
47. As a Grower, I want leftover seedlings kept in the Nursery to produce a new Transplant Task, so that I don't forget them.
48. As a Grower, I want to complete a Harvest Task by entering the kg harvested from that Table, so that real yield is recorded.
49. As a Grower, I want harvesting a Placement to free its Slots immediately, so that the next Batch can go there the same day.
50. As a Grower, I want to harvest each Placement of a Batch on a different day if one Table is slower, so that I pull plants only when they are ready.
51. As a Grower, I want a Batch to become a Closed Batch once every Placement is harvested, so that finished work leaves my lists.
52. As a Grower, I want to correct a mistyped number on a completed Task, so that the records stay right.

### Tables view

53. As a Grower, I want to see every Table with used and free Slots, so that I can see the space at a glance.
54. As a Grower, I want to see each Placement on a Table with its Variety, sow date and days left until harvest, so that I know what is growing where.
55. As a Grower, I want to open a Table and see its upcoming transplants and harvests, so that I can plan cleaning it.

### Plan view

56. As a Grower, I want a 12-week view of expected kg against target per week, so that I can see future Shortfalls early.
57. As a Grower, I want each week to show the Batches behind it (Planned or Active), with sow, transplant and harvest dates, so that I understand where the number comes from.
58. As a Grower, I want weeks where projected Slots run out to be flagged, so that I can add space or lower a target before seedlings have nowhere to go.
59. As a Grower, I want past weeks to show actual kg harvested against target, so that I can judge how well we performed.
60. As a Grower, I want to tell Planned Batches apart from Active Batches visually, so that I know what is real and what is only a plan.

## Implementation Decisions

### Stack and deployment
- Next.js App Router with TypeScript. Tailwind CSS with daisyUI. Mobile-first layout with a bottom tab bar: วันนี้ / โต๊ะ / แผน / ตั้งค่า.
- PostgreSQL through Prisma.
- NextAuth (Auth.js) Credentials provider with username and password. Passwords are hashed with argon2 or bcrypt. JWT session in an HttpOnly cookie with a long expiry.
- All UI text is formal Thai. Dates are shown in Thai with Buddhist Era years where appropriate. Code and identifiers are in English, using the glossary terms.
- Docker Compose runs the app and Postgres on the home server. LAN only, over plain HTTP. No port forwarding. Postgres is reachable only on the internal Docker network.
- A web app manifest and icons provide add-to-home-screen. No service worker and no offline support.
- All dates are calendar dates (no time of day) in Asia/Bangkok. Weeks start on Monday.

### Modules

**1. Schedule engine (deep, pure, no I/O).** This is the core of the app. Its interface is a single function:

`buildSchedule(input) -> Schedule`

- Input: farm `harvestWeekday`; Tables (slot counts); Varieties; Harvest Target versions; Skipped Weeks; Active and Closed Batches with their Placements; `today`; `horizonWeeks` (default 12).
- Output:
  - `plannedBatches`: Variety, harvest week, harvest date, sow date, transplant date, plants to sow, plants to transplant.
  - `tasks`: Sow, Transplant or Harvest, with due date, overdue flag, and references to the Batch or Placement.
  - `weeks`: for each week from a few weeks in the past through the horizon, per Variety: target kg, expected kg (actual where harvested), Shortfall, and the Batches contributing.
  - `slotForecast`: projected Slots in use against Farm Capacity per day or week, flagging overruns.
  - `standingSlots`: per target and in total, against Farm Capacity, plus the maximum supportable kg per week.
- Rules (these are the decisions the tests pin down):
  - Each harvest week has one Harvest Day: the date in that week matching the farm's weekday.
  - The Harvest Target that applies to a week is the version with the latest effective week on or before it. A week with 0 kg, or a Skipped Week, has no Batch.
  - Plants to transplant = ceil(target kg × 1000 / grams per plant). Plants to sow = ceil(plants to transplant / survival rate). The survival rate covers losses from Sow to Transplant. Losses during Grow-out are not modelled; they show up as lower weight.
  - Planned transplant date = Harvest Day − Grow-out days. Planned sow date = transplant date − nursery days − germination days.
  - A Planned Batch exists for a Variety and harvest week only when no Active or Closed Batch exists for that same pair (one Batch per Variety per week).
  - A Planned Batch whose sow date is before `today` produces an Overdue Sow Task.
  - An Active Batch uses the durations and rates copied onto it at Sow. Its expected transplant date = actual sow date + germination + nursery days. Its expected harvest date per Placement = actual transplant date + Grow-out days.
  - Expected kg for a Placement = plants transplanted × grams per plant. For an Active Batch not yet transplanted, expected kg = floor(sown × survival) × grams per plant. Harvested Placements count their actual kg.
  - Expected kg counts towards the week in which the expected or actual harvest date falls.
  - Shortfall = max(0, target − expected) per Variety per week.
  - Standing Slots for a target = plants to transplant per week × ceil(Grow-out days / 7). This is peak occupancy, assuming Slots freed on a Harvest Day can be reused for a transplant on the same day. The maximum supportable kg is derived by inverting this against Farm Capacity, after subtracting other targets' Standing Slots.
- Planned Batches are never persisted (ADR-0001).

**2. Placement proposer (pure).**

`proposePlacements(plantCount, tables: {id, freeSlots}[]) -> { placements: {tableId, plants}[], unplaced }`

- Use as few Tables as possible. Prefer a single Table that fits the whole Batch, choosing the smallest one that fits (best fit). Otherwise fill the Tables with the most free Slots first. Ties are broken by Table name so results are deterministic.
- Never exceed `freeSlots`. Return the remainder as `unplaced`.

**3. Task completion (server actions).**
- Complete Sow: creates an Active Batch with the Variety, harvest week, actual sow date and sown count, plus a snapshot of the Variety's durations, survival rate and grams per plant. Rejected if a Batch already exists for that Variety and week.
- Skip Sow: creates a Skipped Week.
- Complete Transplant: inside one transaction, checks each Table's free Slots, then creates Placements with an actual transplant date. Surplus seedlings are either kept (the Batch keeps a `nurseryRemaining` count, which produces another Transplant Task due today) or discarded.
- Complete Harvest: sets the actual harvest date and kg on the Placement, which frees its Slots. When no Placement is unharvested and `nurseryRemaining` is 0, the Batch becomes Closed.
- Edit a completed record: change counts, kg or dates, with the same validations.

**4. Persistence (Prisma schema, conceptual).**
- `Farm`: name, harvestWeekday.
- `Grower`: farm, unique username, passwordHash, mustChangePassword.
- `Table`: farm, name, slotCount.
- `Variety`: farm, name, germinationDays, nurseryDays, growOutDays, survivalRate, gramsPerPlant.
- `HarvestTargetVersion`: variety, effectiveWeek (a Monday), kgPerWeek. Unique on (variety, effectiveWeek).
- `SkippedWeek`: variety, week. Unique on (variety, week).
- `Batch`: variety, harvestWeek, sowDate, sownCount, nurseryRemaining, status (ACTIVE or CLOSED), plus snapshot fields. Unique on (variety, harvestWeek).
- `Placement`: batch, table, transplantDate, plantCount, harvestDate (nullable), harvestKg (nullable).
- Free Slots for a Table = slotCount − sum of plantCount over its unharvested Placements. This is derived and never stored.

**5. Auth and Growers.**
- `/setup` is reachable only while the Grower table is empty. It creates the Farm (with green oak pre-filled as a Variety) and the first Grower.
- Every other route needs a session. A Grower with `mustChangePassword` is redirected to change their password.
- Growers can create other Growers, reset their passwords and delete them, but cannot delete the last Grower.
- A CLI script resets a password from the server.

**6. UI screens.** Today (Tasks and this week's kg against target), Tables, Plan (12 weeks), Settings (Farm, Harvest Day, Tables, Varieties, Harvest Targets and Skipped Weeks, Growers, own password). Each screen loads the farm state, calls `buildSchedule` and renders the result. Nothing is cached.

## Testing Decisions

- A good test drives a module only through its public function, using plain input data, and asserts on the output. It never asserts on internal helpers or intermediate structures. Tests are named after the grower-visible rule they protect (e.g. "a Skipped Week produces no Batch").
- **Schedule engine.** Table-driven unit tests covering: date back-calculation for several Harvest Days and Grow-out lengths (including ones that are not a multiple of 7); rounding of plant counts; picking the target version at an effective-week boundary; a target of 0 kg; Skipped Weeks; Active Batches replacing Planned ones; Overdue Sow Tasks; expected kg from sown, transplanted and harvested states; Placements of one Batch harvested in different weeks; Shortfall; Standing Slots and maximum supportable kg; slot-forecast overruns; Variety edits not affecting snapshotted Active Batches; month and year boundaries.
- **Placement proposer.** Unit tests for: a single best-fit Table; spreading across Tables when none fits; deterministic tie-breaking; never exceeding free Slots; the `unplaced` remainder; no free Tables; a zero plant count.
- Runner: Vitest. There is no prior art in the repo because it is empty; these tests set the pattern.
- Task completion, auth and UI get no automated tests in this MVP, by the user's choice.

## Out of Scope

- Offline use and service workers.
- Access from outside the farm network: no port forwarding, public HTTPS or domain.
- Roles and permissions. All Growers are equal.
- Recording which Grower completed a Task.
- Tracking individual plants or Slots, partial harvests within a Placement, and repeat-cut crops.
- Recording Grow-out losses, EC/pH or nutrient logs.
- Nursery capacity limits.
- Rules that tie Tables to Varieties.
- Editing a single Planned Batch (ADR-0001).
- Automatic re-planning or compensation for Shortfalls.
- Suggesting Variety value changes from actual results. This is a later feature.
- Multiple farms, multi-tenancy and sign-up.
- Customers, orders, sales and delivery.
- Languages other than Thai.

## Further Notes

- The Variety values are generic estimates; the farm has not measured its own yet. With these defaults, a 10 kg per week green oak target needs 84 plants transplanted and 99 sown per week, and 84 × ceil(30/7) = 420 Standing Slots. The farm's real Slot count is still unknown, so the capacity warning will be the first real check.
- Everything is scoped to a single Farm row from day one, so that supporting multiple farms later doesn't require a schema rewrite.
- If the app is ever exposed outside the LAN, add HTTPS via a reverse proxy, forward port 443 only, and add login lockout or rate limiting before opening the port.
