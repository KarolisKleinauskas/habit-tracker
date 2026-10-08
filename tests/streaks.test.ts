import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { calculateStreaks, calculateStreaksAt, formatTimes, pluralLt } from "@/lib/streaks";

const DAILY = [1, 2, 3, 4, 5, 6, 7];
const MON_WED_FRI = [1, 3, 5];
const TODAY = "2026-10-08"; // Thursday

/** n consecutive days ending at `end` (inclusive). */
function daysEnding(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, -i));
}

const streaks = (scheduleDays: number[], dates: string[], today = TODAY, startDate?: string) =>
  calculateStreaks({ scheduleDays, completedDates: new Set(dates), today, startDate });

describe("calculateStreaks: basics", () => {
  it("returns zeros for an empty history", () => {
    expect(streaks(DAILY, [])).toEqual({ current: 0, longest: 0, todayCounted: false });
    expect(streaks(DAILY, [], TODAY, "2026-01-01")).toMatchObject({ current: 0, longest: 0 });
  });

  it("counts consecutive completed days including today", () => {
    expect(streaks(DAILY, daysEnding(TODAY, 5))).toEqual({
      current: 5,
      longest: 5,
      todayCounted: true,
    });
  });

  it("a missed past day breaks the current streak but keeps the longest", () => {
    const dates = [...daysEnding("2026-10-08", 2), ...daysEnding("2026-10-05", 4)]; // gap on 10-06
    expect(streaks(DAILY, dates)).toMatchObject({ current: 2, longest: 4 });
  });

  it("missing yesterday resets the current streak to 0", () => {
    expect(streaks(DAILY, daysEnding("2026-10-06", 3))).toMatchObject({ current: 0, longest: 3 });
  });

  it("ignores future completions", () => {
    expect(streaks(DAILY, ["2026-10-09", "2026-10-10"])).toMatchObject({ current: 0, longest: 0 });
  });
});

describe("calculateStreaks: today is still open", () => {
  it("today not done yet does not break the streak", () => {
    expect(streaks(DAILY, daysEnding("2026-10-07", 3))).toEqual({
      current: 3,
      longest: 3,
      todayCounted: false,
    });
  });

  it("completing today extends it by one", () => {
    expect(streaks(DAILY, daysEnding(TODAY, 4))).toMatchObject({ current: 4, todayCounted: true });
  });
});

describe("calculateStreaks: unscheduled days", () => {
  it("Tuesday does not break a Mon/Wed/Fri streak", () => {
    // Mon 09-28, Wed 09-30, Fri 10-02, Mon 10-05, Wed 10-07; today Thu 10-08 is unscheduled
    const dates = ["2026-09-28", "2026-09-30", "2026-10-02", "2026-10-05", "2026-10-07"];
    expect(streaks(MON_WED_FRI, dates)).toEqual({ current: 5, longest: 5, todayCounted: false });
  });

  it("a missed scheduled day breaks it", () => {
    const dates = ["2026-09-28", "2026-09-30", /* Fri 10-02 missed */ "2026-10-05", "2026-10-07"];
    expect(streaks(MON_WED_FRI, dates)).toMatchObject({ current: 2, longest: 2 });
  });

  it("bonus completions on unscheduled days neither count nor break", () => {
    const dates = ["2026-10-05", "2026-10-06" /* Tue bonus */, "2026-10-07", "2026-10-08" /* Thu bonus */];
    expect(streaks(MON_WED_FRI, dates)).toEqual({ current: 2, longest: 2, todayCounted: false });
  });

  it("a weekend-only habit keeps its streak through the whole week", () => {
    // Sat/Sun habit; done 09-26, 09-27, 10-03, 10-04; today Thursday
    const dates = ["2026-09-26", "2026-09-27", "2026-10-03", "2026-10-04"];
    expect(streaks([6, 7], dates)).toMatchObject({ current: 4, longest: 4 });
  });

  it("returns zeros when nothing is scheduled", () => {
    expect(streaks([], daysEnding(TODAY, 3))).toMatchObject({ current: 0, longest: 0 });
  });
});

describe("calculateStreaks: start date", () => {
  it("days before the habit existed never break the streak", () => {
    expect(streaks(DAILY, daysEnding(TODAY, 3), TODAY, "2026-10-06")).toMatchObject({
      current: 3,
      longest: 3,
    });
  });

  it("a habit created today with no completion has no streak yet", () => {
    expect(streaks(DAILY, [], TODAY, TODAY)).toMatchObject({ current: 0, longest: 0 });
  });

  it("misses between creation and the first completion still break", () => {
    expect(streaks(DAILY, ["2026-10-08"], TODAY, "2026-10-01")).toMatchObject({
      current: 1,
      longest: 1,
    });
  });
});

describe("calculateStreaks: DST and long ranges", () => {
  it("counts every day across the EU spring-forward change (23-hour day)", () => {
    // 2026-03-29 has 23 hours in Europe/Vilnius
    expect(streaks(DAILY, daysEnding("2026-04-02", 10), "2026-04-02")).toMatchObject({
      current: 10,
      longest: 10,
    });
  });

  it("counts every day across the EU fall-back change (25-hour day)", () => {
    // 2026-10-25 has 25 hours in Europe/Vilnius
    expect(streaks(DAILY, daysEnding("2026-10-28", 7), "2026-10-28")).toMatchObject({
      current: 7,
      longest: 7,
    });
  });

  it("handles a full year and leap day", () => {
    expect(streaks(DAILY, daysEnding("2028-03-01", 400), "2028-03-01")).toMatchObject({
      current: 400,
      longest: 400,
    });
  });
});

describe("calculateStreaksAt: time zones", () => {
  const habit = {
    scheduleDays: DAILY,
    // Completed Oct 6–8 in the user's zone
    completedDates: new Set(["2026-10-06", "2026-10-07", "2026-10-08"]),
    createdAt: new Date("2026-10-01T09:00:00Z"),
  };

  it("uses the user's day, not UTC: after midnight in Vilnius the streak is pending, not broken", () => {
    // 22:30 UTC = 01:30 on Oct 9 in Vilnius → Oct 9 is today and still open
    const now = new Date("2026-10-08T22:30:00Z");
    expect(calculateStreaksAt({ ...habit, timezone: "Europe/Vilnius", now })).toEqual({
      current: 3,
      longest: 3,
      todayCounted: false,
    });
    // Same instant in UTC is still Oct 8, already done
    expect(calculateStreaksAt({ ...habit, timezone: "UTC", now })).toMatchObject({
      current: 3,
      todayCounted: true,
    });
  });

  it("breaks once a full local day has been missed", () => {
    // Oct 10, 12:00 in Vilnius → Oct 9 was missed
    const now = new Date("2026-10-10T09:00:00Z");
    expect(calculateStreaksAt({ ...habit, timezone: "Europe/Vilnius", now })).toMatchObject({
      current: 0,
      longest: 3,
    });
  });

  it("zones west of UTC see the previous day", () => {
    // 03:00 UTC Oct 9 = 20:00 Oct 8 in Los Angeles → Oct 8 is today and done
    const now = new Date("2026-10-09T03:00:00Z");
    expect(calculateStreaksAt({ ...habit, timezone: "America/Los_Angeles", now })).toMatchObject({
      current: 3,
      todayCounted: true,
    });
  });

  it("a zone with a +13/+14 offset is already a day ahead", () => {
    // 12:00 UTC Oct 8 = 01:00 Oct 9 in Pacific/Kiritimati (UTC+14)
    const now = new Date("2026-10-08T12:00:00Z");
    expect(calculateStreaksAt({ ...habit, timezone: "Pacific/Kiritimati", now })).toMatchObject({
      current: 3,
      todayCounted: false,
    });
  });

  it("creation day is computed in the user's zone", () => {
    // Created 23:30 UTC Oct 7 = Oct 8 in Vilnius → Oct 7 is before the habit existed
    const result = calculateStreaksAt({
      scheduleDays: DAILY,
      completedDates: new Set(["2026-10-08"]),
      createdAt: new Date("2026-10-07T23:30:00Z"),
      timezone: "Europe/Vilnius",
      now: new Date("2026-10-08T10:00:00Z"),
    });
    expect(result).toMatchObject({ current: 1, longest: 1 });
  });
});

describe("pluralLt / formatTimes", () => {
  it("follows Lithuanian plural rules", () => {
    const forms = ["kartas", "kartai", "kartų"] as const;
    const cases: [number, string][] = [
      [0, "kartų"], [1, "kartas"], [2, "kartai"], [9, "kartai"], [10, "kartų"],
      [11, "kartų"], [15, "kartų"], [19, "kartų"], [20, "kartų"], [21, "kartas"],
      [22, "kartai"], [101, "kartas"], [111, "kartų"], [112, "kartų"],
    ];
    for (const [n, expected] of cases) expect(pluralLt(n, forms), String(n)).toBe(expected);
    expect(formatTimes(21)).toBe("21 kartas");
  });
});
