# Hydroponics Planting Schedule

Mobile-first planning of NFT hydroponic plantings, staggered so that harvests come continuously instead of all at once.

## Language

### People

**Farm**:
One hydroponic operation owning its **Tables**, **Varieties**, **Harvest Targets** and **Batches**. Everything belongs to exactly one Farm.
_Avoid_: site, greenhouse, organization

**Grower**:
Anyone who works on a **Farm** and records what happened. All Growers have the same permissions.
_Avoid_: user, worker, staff, owner

### Growing space

**Table**:
One NFT growing table made of channels with a fixed number of **Slots**. The unit of growing space a grower plans against.
_Avoid_: แปลง, bed, plot

**Slot**:
One planting hole in a **Table** that holds exactly one plant. **Table** capacity is counted in Slots.
_Avoid_: หลุม (ok in UI copy, but Slot in the model), hole, cell

### Crops

**Variety**:
One kind of salad green (e.g. green oak, red oak, cos) with its standard stage durations, expected survival rate, and average harvest weight per plant. The recipe that schedules are calculated from.
_Avoid_: crop, plant type, พืช

### Planning

**Harvest Target**:
How many kilograms of one **Variety** the grower wants to harvest each week, from a given effective week onward. The input that drives **Succession planting**; **Batches** are sized and dated backwards from it. Changing a target means adding a new amount from a later effective week, not rewriting the past.
_Avoid_: goal, quota, demand

**Skipped Week**:
A week in which a **Harvest Target** deliberately produces no **Batch** (e.g. a holiday).
_Avoid_: pause, holiday, break

**Harvest Day**:
The one fixed weekday the farm harvests on. Every **Variety** is scheduled to reach **Harvest** on this day, so each Variety's **Sow** day differs by its growing time.
_Avoid_: delivery day, market day

Each **Harvest Target** produces exactly one **Batch** per week.

**Standing Slots**:
The number of **Slots** a **Harvest Target** keeps occupied at all times once succession is running (plants transplanted per week × weeks of **Grow-out**). Compared against **Farm Capacity** when a target is set.
_Avoid_: required slots, slot demand

**Farm Capacity**:
The total **Slots** across all **Tables** on the farm.
_Avoid_: total space, size

### Growing cycle

**Stage**:
Where a **Batch** is in its cycle: **Sow** → **Nursery** → **Grow-out** → **Harvest**. Only Grow-out occupies **Slots**.
_Avoid_: status, phase

**Sow**:
Placing seeds into sponge cubes to germinate. Starts a **Batch**.
_Avoid_: เพาะ (ok in UI copy), seeding

**Nursery**:
Seedlings growing on after germination, before **Transplant**. Nursery space is assumed to be unlimited.
_Avoid_: อนุบาล (ok in UI copy)

**Grow-out**:
The period between **Transplant** and **Harvest**, when a **Placement** occupies **Slots** on a **Table**.
_Avoid_: growing, on-table

**Harvest**:
Pulling a whole **Placement** at once, which frees its **Slots**, and weighing it in kilograms. Each Placement of a **Batch** is harvested and weighed separately and may be on a different day. There is no partial harvest of a Placement and no repeat cutting. Plants lost during **Grow-out** are not recorded; they show up as lower weight.
_Avoid_: pick, cut

**Batch**:
A group of plants of one **Variety** sown on the same day, tracked as a count through every stage until harvest. Individual plants and Slots are not tracked.
_Avoid_: รุ่น (ok in UI copy), lot, crop, planting

**Planned Batch**:
A **Batch** the app has scheduled from a **Harvest Target** but the grower has not yet sown. Always derived from the current Harvest Targets and **Skipped Weeks** — never edited one by one. Becomes an **Active Batch** when the grower confirms **Sow**.
_Avoid_: draft, forecast

**Active Batch**:
A **Batch** that has actually been sown and is not yet fully harvested. Its real counts (sown, transplanted per **Placement**, kg harvested) are recorded by the grower.
_Avoid_: in-progress, running

**Closed Batch**:
A **Batch** whose every **Placement** has been harvested.
_Avoid_: done, finished, archived

**Shortfall**:
How many kilograms a week's expected harvest falls below its **Harvest Target**. Shown as a warning; the app never re-plans future **Batches** on its own.
_Avoid_: deficit, gap

**Placement**:
The part of a **Batch** transplanted onto one **Table**, measured in **Slots**. One **Batch** has one or more Placements; one **Table** can hold Placements from many **Batches** at once. The app proposes Placements; the grower can change them at **Transplant**. Any **Table** may hold any **Variety**.
_Avoid_: allocation, assignment

**Transplant**:
Moving seedlings from the nursery into **Slots** on a **Table**. This is what growers mean by "ลงแปลง".
_Avoid_: ลงแปลง (in the model), planting

**Succession planting**:
Starting plantings at staggered intervals so harvests overlap and output is continuous. This is what growers mean by "หมุนเวียนรอบปลูก".
_Avoid_: crop rotation (different concept — alternating plant families on soil)

### Daily work

**Task**:
One thing a **Grower** must do on a given day — **Sow**, **Transplant** or **Harvest** a **Batch** — generated from the schedule. Completing a Task is how real counts and weights get recorded. Which **Grower** completed it is not recorded.
_Avoid_: job, todo, activity

**Overdue Task**:
A **Task** whose day has passed without being completed.
_Avoid_: late, missed

## Flagged ambiguities

- "ลงแปลง" comes from soil farming; in this context it means **Transplant** onto a **Table**, not planting into a soil plot.
- "หมุนเวียน" means **Succession planting**, not crop rotation.
- "รุ่น" in conversation means a **Batch**, never a **Variety**.

## Example dialogue

> **Dev:** If the **Harvest Target** for green oak goes from 10 to 15 kg, do we edit next month's **Batches**?
> **Grower:** No — add 15 kg from the week it starts. Every **Planned Batch** after that is recalculated; anything already sown stays an **Active Batch** as it is.
> **Dev:** And will the **Tables** fit it?
> **Grower:** The app compares the new **Standing Slots** with **Farm Capacity** when I save the target, and warns me if it doesn't fit.
> **Dev:** On **Transplant** day, the **Batch** doesn't fit on one Table. What happens?
> **Grower:** The app proposes two **Placements**, say 60 Slots on Table A and 30 on Table B. I can change them before I complete the **Task**.
> **Dev:** Table B grows slower. Do we harvest both on **Harvest Day**?
> **Grower:** We harvest each **Placement** when it's ready and weigh it separately. The Batch is a **Closed Batch** once both are in. If the week comes in under target, that's a **Shortfall** and I decide whether to sow extra.
