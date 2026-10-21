import { describe, expect, it } from "vitest";
import {
  HarvestDaySchema,
  HarvestSchema,
  SowSchema,
  TableSchema,
  TargetSchema,
  TransplantSchema,
  VarietySchema,
  WeekSchema,
} from "./schemas";

const validVariety = {
  name: "กรีนโอ๊ค",
  germinationDays: "5",
  nurseryDays: "14",
  growOutDays: "30",
  survivalPercent: "85",
  gramsPerPlant: "120",
};

describe("TableSchema", () => {
  it("accepts a name and a positive Slot count, and trims the name", () => {
    expect(TableSchema.parse({ name: "  โต๊ะ A ", slotCount: "120" })).toEqual({
      name: "โต๊ะ A",
      slotCount: 120,
    });
  });

  it("rejects zero, negative, fractional and non-numeric Slot counts", () => {
    for (const slotCount of ["0", "-5", "12.5", "abc", ""]) {
      expect(TableSchema.safeParse({ name: "A", slotCount }).success).toBe(false);
    }
  });

  it("rejects a blank name", () => {
    expect(TableSchema.safeParse({ name: "   ", slotCount: "10" }).success).toBe(false);
  });
});

describe("VarietySchema", () => {
  it("accepts the green oak defaults", () => {
    const parsed = VarietySchema.parse(validVariety);
    expect(parsed.survivalPercent).toBe(85);
    expect(parsed.growOutDays).toBe(30);
  });

  it("keeps survival between 1 and 100", () => {
    expect(VarietySchema.safeParse({ ...validVariety, survivalPercent: "0" }).success).toBe(false);
    expect(VarietySchema.safeParse({ ...validVariety, survivalPercent: "101" }).success).toBe(false);
    expect(VarietySchema.safeParse({ ...validVariety, survivalPercent: "100" }).success).toBe(true);
  });

  it("requires every day count to be a positive whole number", () => {
    for (const field of ["germinationDays", "nurseryDays", "growOutDays"]) {
      expect(VarietySchema.safeParse({ ...validVariety, [field]: "0" }).success).toBe(false);
      expect(VarietySchema.safeParse({ ...validVariety, [field]: "2.5" }).success).toBe(false);
    }
  });

  it("requires a positive weight per plant", () => {
    expect(VarietySchema.safeParse({ ...validVariety, gramsPerPlant: "0" }).success).toBe(false);
  });

  it("reports errors per field in Thai", () => {
    const result = VarietySchema.safeParse({ ...validVariety, name: "", survivalPercent: "150" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name?.[0]).toBe("กรุณากรอกชื่อพันธุ์");
      expect(errors.survivalPercent?.[0]).toBe("อัตรารอดต้องไม่เกิน 100");
    }
  });
});

describe("HarvestDaySchema", () => {
  it("accepts weekdays 0 to 6 only", () => {
    expect(HarvestDaySchema.safeParse({ harvestWeekday: "0" }).success).toBe(true);
    expect(HarvestDaySchema.safeParse({ harvestWeekday: "6" }).success).toBe(true);
    expect(HarvestDaySchema.safeParse({ harvestWeekday: "7" }).success).toBe(false);
  });
});

describe("TargetSchema", () => {
  const week = "2026-10-26"; // a Monday

  it("accepts whole and decimal kilograms", () => {
    expect(TargetSchema.parse({ kgPerWeek: "10", effectiveWeek: week }).kgPerWeek).toBe(10);
    expect(TargetSchema.parse({ kgPerWeek: " 7.5 ", effectiveWeek: week }).kgPerWeek).toBe(7.5);
  });

  it("accepts 0, which stops the Variety", () => {
    expect(TargetSchema.safeParse({ kgPerWeek: "0", effectiveWeek: week }).success).toBe(true);
  });

  it("treats a blank field as an error rather than 0 kg", () => {
    for (const kgPerWeek of ["", "   "]) {
      expect(TargetSchema.safeParse({ kgPerWeek, effectiveWeek: week }).success).toBe(false);
    }
  });

  it("rejects negative, non-numeric and too precise amounts", () => {
    for (const kgPerWeek of ["-1", "abc", "1.2345"]) {
      expect(TargetSchema.safeParse({ kgPerWeek, effectiveWeek: week }).success).toBe(false);
    }
  });

  it("only accepts a real Monday for the effective week", () => {
    expect(TargetSchema.safeParse({ kgPerWeek: "10", effectiveWeek: "2026-10-27" }).success).toBe(false); // Tuesday
    expect(TargetSchema.safeParse({ kgPerWeek: "10", effectiveWeek: "2026-02-30" }).success).toBe(false); // not a date
    expect(TargetSchema.safeParse({ kgPerWeek: "10", effectiveWeek: "26/10/2026" }).success).toBe(false);
  });
});

describe("WeekSchema", () => {
  it("only accepts a Monday", () => {
    expect(WeekSchema.safeParse({ week: "2026-10-26" }).success).toBe(true);
    expect(WeekSchema.safeParse({ week: "2026-10-25" }).success).toBe(false);
  });
});

describe("SowSchema", () => {
  it("accepts a positive whole count and a real date", () => {
    expect(SowSchema.parse({ sownCount: "99", sowDate: "2026-10-21" })).toEqual({
      sownCount: 99,
      sowDate: "2026-10-21",
    });
  });

  it("rejects a zero, fractional, blank or non-numeric count", () => {
    for (const sownCount of ["0", "12.5", "", "abc", "-3"]) {
      expect(SowSchema.safeParse({ sownCount, sowDate: "2026-10-21" }).success).toBe(false);
    }
  });

  it("rejects a date that does not exist or is not in YYYY-MM-DD form", () => {
    for (const sowDate of ["2026-02-30", "21/10/2026", ""]) {
      expect(SowSchema.safeParse({ sownCount: "10", sowDate }).success).toBe(false);
    }
  });
});

describe("HarvestSchema", () => {
  const harvestDate = "2026-10-26";

  it("accepts a positive weight with up to 3 decimals", () => {
    expect(HarvestSchema.parse({ harvestKg: "9.4", harvestDate }).harvestKg).toBe(9.4);
    expect(HarvestSchema.parse({ harvestKg: " 10 ", harvestDate }).harvestKg).toBe(10);
    expect(HarvestSchema.parse({ harvestKg: "0.125", harvestDate }).harvestKg).toBe(0.125);
  });

  it("rejects 0, negative, blank, non-numeric and over-precise weights", () => {
    for (const harvestKg of ["0", "-1", "", "  ", "abc", "1.2345", "1,5"]) {
      expect(HarvestSchema.safeParse({ harvestKg, harvestDate }).success).toBe(false);
    }
  });

  it("rejects a date that does not exist", () => {
    expect(HarvestSchema.safeParse({ harvestKg: "5", harvestDate: "2026-02-30" }).success).toBe(false);
  });
});

describe("TransplantSchema", () => {
  it("accepts a count, a date and a choice for the leftover seedlings", () => {
    const parsed = TransplantSchema.parse({ available: "84", transplantDate: "2026-10-24", leftover: "keep" });
    expect(parsed).toEqual({ available: 84, transplantDate: "2026-10-24", leftover: "keep" });
  });

  it("rejects a zero count and an unknown choice", () => {
    expect(TransplantSchema.safeParse({ available: "0", transplantDate: "2026-10-24", leftover: "keep" }).success).toBe(false);
    expect(TransplantSchema.safeParse({ available: "5", transplantDate: "2026-10-24", leftover: "sell" }).success).toBe(false);
  });
});
