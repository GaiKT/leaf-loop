// Calendar dates without a time of day are plain "YYYY-MM-DD" strings. They sort correctly as text
// and cannot shift with the server's time zone.
export type IsoDate = string;

const MS_PER_DAY = 86_400_000;

function toEpochDay(date: IsoDate) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function fromEpochDay(epochDay: number): IsoDate {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromEpochDay(toEpochDay(date) + days);
}

export function daysBetween(from: IsoDate, to: IsoDate) {
  return toEpochDay(to) - toEpochDay(from);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(date: IsoDate) {
  return new Date(toEpochDay(date) * MS_PER_DAY).getUTCDay();
}

/** The Monday that starts the week containing `date`. Weeks run Monday to Sunday. */
export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** The date of the farm's Harvest Day within the week that starts on `weekMonday`. */
export function harvestDateForWeek(weekMonday: IsoDate, harvestWeekday: number): IsoDate {
  return addDays(weekMonday, (harvestWeekday + 6) % 7);
}

export function todayInBangkok(now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}

/** A Prisma `@db.Date` value (UTC midnight) as an IsoDate. */
export function fromDbDate(value: Date): IsoDate {
  return value.toISOString().slice(0, 10);
}

/** An IsoDate as a value Prisma stores in a `@db.Date` column. */
export function toDbDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** e.g. "จ. 20 ต.ค." */
export function formatThaiDate(date: IsoDate) {
  return new Date(toEpochDay(date) * MS_PER_DAY).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** True only for a real calendar date written as YYYY-MM-DD (so not 2026-02-30). Never throws. */
export function isIsoDate(value: string): value is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;
}
