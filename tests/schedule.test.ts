import { describe, expect, it } from "vitest";
import { formatSchedule, isScheduledOn, isoWeekday, normalizeSchedule } from "@/lib/schedule";

describe("isoWeekday", () => {
  it("maps date keys to ISO weekdays", () => {
    expect(isoWeekday("2026-10-05")).toBe(1); // Monday
    expect(isoWeekday("2026-10-08")).toBe(4); // Thursday
    expect(isoWeekday("2026-10-11")).toBe(7); // Sunday
  });

  it("is stable on DST change days", () => {
    expect(isoWeekday("2026-03-29")).toBe(7); // EU spring forward, Sunday
    expect(isoWeekday("2026-10-25")).toBe(7); // EU fall back, Sunday
  });

  it("handles leap days and year boundaries", () => {
    expect(isoWeekday("2028-02-29")).toBe(2);
    expect(isoWeekday("2026-12-31")).toBe(4);
    expect(isoWeekday("2027-01-01")).toBe(5);
  });
});

describe("isScheduledOn", () => {
  it("checks the weekday against the schedule", () => {
    const monWedFri = [1, 3, 5];
    expect(isScheduledOn(monWedFri, "2026-10-05")).toBe(true); // Mon
    expect(isScheduledOn(monWedFri, "2026-10-06")).toBe(false); // Tue
  });
});

describe("normalizeSchedule", () => {
  it("sorts, de-duplicates and drops invalid values", () => {
    expect(normalizeSchedule([5, 1, 3, 3, 0, 8, 2.5])).toEqual([1, 3, 5]);
  });
});

describe("formatSchedule", () => {
  it("names common presets", () => {
    expect(formatSchedule([1, 2, 3, 4, 5, 6, 7])).toBe("Kasdien");
    expect(formatSchedule([5, 4, 3, 2, 1])).toBe("Darbo dienomis");
    expect(formatSchedule([6, 7])).toBe("Savaitgaliais");
  });

  it("lists other schedules with short names", () => {
    expect(formatSchedule([1, 3, 5])).toBe("Pr, Tr, Pn");
  });
});
