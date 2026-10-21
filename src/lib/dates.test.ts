import { describe, expect, it } from "vitest";
import { addDays, harvestDateForWeek, isIsoDate, mondayOf, todayInBangkok, weekdayOf } from "./dates";

describe("addDays", () => {
  it("crosses month and year boundaries in both directions", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2027-01-02", -3)).toBe("2026-12-30");
  });

  it("handles leap days", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });
});

describe("weekdayOf", () => {
  it("returns 0 for Sunday and 1 for Monday", () => {
    expect(weekdayOf("2026-10-18")).toBe(0);
    expect(weekdayOf("2026-10-19")).toBe(1);
  });
});

describe("mondayOf", () => {
  it("returns the same date for a Monday", () => {
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
  });

  it("returns the preceding Monday for a Sunday, not the following one", () => {
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
  });

  it("works across a year boundary", () => {
    expect(mondayOf("2027-01-01")).toBe("2026-12-28");
  });
});

describe("harvestDateForWeek", () => {
  const week = "2026-10-19"; // a Monday

  it("puts a Monday Harvest Day on the Monday itself", () => {
    expect(harvestDateForWeek(week, 1)).toBe("2026-10-19");
  });

  it("puts a Wednesday Harvest Day two days later", () => {
    expect(harvestDateForWeek(week, 3)).toBe("2026-10-21");
  });

  it("puts a Sunday Harvest Day at the end of the Monday-first week", () => {
    expect(harvestDateForWeek(week, 0)).toBe("2026-10-25");
  });
});

describe("todayInBangkok", () => {
  it("uses the Bangkok calendar date, not UTC", () => {
    // 20:00 UTC on the 20th is already 03:00 on the 21st in Bangkok.
    expect(todayInBangkok(new Date("2026-10-20T20:00:00Z"))).toBe("2026-10-21");
    expect(todayInBangkok(new Date("2026-10-20T16:59:00Z"))).toBe("2026-10-20");
  });
});

describe("isIsoDate", () => {
  it("accepts real dates", () => {
    expect(isIsoDate("2026-10-26")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates and other formats without throwing", () => {
    for (const value of ["2026-02-30", "2027-02-29", "26/10/2026", "2026-1-5", "", "abc"]) {
      expect(isIsoDate(value)).toBe(false);
    }
  });
});
