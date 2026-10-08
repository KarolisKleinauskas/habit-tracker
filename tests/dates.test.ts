import { describe, expect, it } from "vitest";
import {
  addDays,
  isDateKey,
  isValidTimeZone,
  normalizeTimeZone,
  todayInTimeZone,
} from "@/lib/dates";

describe("isDateKey", () => {
  it("accepts real calendar days only", () => {
    expect(isDateKey("2026-10-08")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("2026-1-1")).toBe(false);
    expect(isDateKey("")).toBe(false);
  });
});

describe("addDays", () => {
  it("moves across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("is not affected by DST transitions", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-25", -1)).toBe("2026-10-24");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones and UTC", () => {
    expect(isValidTimeZone("Europe/Vilnius")).toBe(true);
    expect(isValidTimeZone("America/Los_Angeles")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});

describe("normalizeTimeZone", () => {
  it("falls back to UTC", () => {
    expect(normalizeTimeZone(undefined)).toBe("UTC");
    expect(normalizeTimeZone("nope")).toBe("UTC");
    expect(normalizeTimeZone("Europe/Vilnius")).toBe("Europe/Vilnius");
  });
});

describe("todayInTimeZone", () => {
  // 2026-10-08 22:30 UTC = 2026-10-09 01:30 in Vilnius (UTC+3, summer time)
  const instant = new Date("2026-10-08T22:30:00Z");

  it("uses the user's zone, not UTC", () => {
    expect(todayInTimeZone("UTC", instant)).toBe("2026-10-08");
    expect(todayInTimeZone("Europe/Vilnius", instant)).toBe("2026-10-09");
    expect(todayInTimeZone("America/New_York", instant)).toBe("2026-10-08");
  });
});
