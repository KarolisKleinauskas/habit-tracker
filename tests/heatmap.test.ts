import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import {
  buildCalendar,
  buildHabitHeatmap,
  buildOverallHeatmap,
  describeCell,
  groupCompletions,
  levelForRatio,
  monthLabels,
  summarize,
  type HeatmapHabit,
} from "@/lib/heatmap";

const TODAY = "2026-10-08"; // Thursday
const flat = <T,>(weeks: T[][]) => weeks.flat();
const cellOn = <T extends { date: string }>(weeks: T[][], date: string) =>
  flat(weeks).find((c) => c.date === date)!;

describe("buildCalendar", () => {
  const calendar = buildCalendar(TODAY);

  it("has 52 Monday-first weeks ending with the current week", () => {
    expect(calendar).toHaveLength(52);
    expect(calendar.every((w) => w.length === 7)).toBe(true);
    expect(calendar.at(-1)![0]).toBe("2026-10-05"); // Monday of the current week
    expect(calendar.at(-1)![6]).toBe("2026-10-11"); // Sunday (future)
    expect(calendar[0][0]).toBe(addDays("2026-10-05", -51 * 7));
  });

  it("contains consecutive days without gaps or duplicates across DST changes", () => {
    const days = calendar.flat();
    for (let i = 1; i < days.length; i++) expect(days[i]).toBe(addDays(days[i - 1], 1));
    expect(days).toContain("2026-03-29"); // EU spring forward
    expect(new Set(days).size).toBe(52 * 7);
  });

  it("works when today is a Monday or Sunday", () => {
    expect(buildCalendar("2026-10-05", 1)[0]).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(buildCalendar("2026-10-11", 1)[0][0]).toBe("2026-10-05");
  });
});

describe("levelForRatio", () => {
  it("buckets ratios", () => {
    expect(levelForRatio(0)).toBe(0);
    expect(levelForRatio(0.1)).toBe(1);
    expect(levelForRatio(1 / 3)).toBe(2);
    expect(levelForRatio(0.5)).toBe(2);
    expect(levelForRatio(2 / 3)).toBe(3);
    expect(levelForRatio(0.99)).toBe(3);
    expect(levelForRatio(1)).toBe(4);
    expect(levelForRatio(Number.NaN)).toBe(0);
  });
});

describe("buildHabitHeatmap", () => {
  // Mon/Wed/Fri habit created on Monday 2026-09-28
  const habit: HeatmapHabit = {
    id: "h1",
    scheduleDays: [1, 3, 5],
    startDate: "2026-09-28",
    endDate: null,
  };
  const done = new Set(["2026-09-28", "2026-10-02", "2026-10-04" /* Sunday, bonus */]);
  const weeks = buildHabitHeatmap(habit, done, TODAY);

  it("marks days before creation as inactive", () => {
    expect(cellOn(weeks, "2026-09-27").state).toBe("inactive");
  });

  it("distinguishes done, missed and unscheduled days", () => {
    expect(cellOn(weeks, "2026-09-28")).toMatchObject({ state: "scheduled", level: 4, done: 1, total: 1 });
    expect(cellOn(weeks, "2026-09-30")).toMatchObject({ state: "scheduled", level: 0, done: 0, total: 1 });
    expect(cellOn(weeks, "2026-09-29")).toMatchObject({ state: "unscheduled", level: 0, total: 0 });
  });

  it("shows bonus completions on unscheduled days without counting them", () => {
    expect(cellOn(weeks, "2026-10-04")).toMatchObject({ state: "unscheduled", level: 4, bonus: true, done: 0 });
  });

  it("marks future days", () => {
    expect(cellOn(weeks, "2026-10-09").state).toBe("future");
  });

  it("stops at the archive date", () => {
    const archived = buildHabitHeatmap({ ...habit, endDate: "2026-10-05" }, done, TODAY);
    expect(cellOn(archived, "2026-10-02").state).toBe("scheduled");
    expect(cellOn(archived, "2026-10-05").state).toBe("inactive");
  });

  it("summarizes scheduled days only", () => {
    // Scheduled: 09-28, 09-30, 10-02, 10-05, 10-07 → done 2 of 5
    expect(summarize(weeks)).toEqual({ done: 2, total: 5 });
  });

  it("handles empty history", () => {
    const empty = buildHabitHeatmap(habit, new Set(), TODAY);
    expect(summarize(empty)).toEqual({ done: 0, total: 5 });
    expect(flat(empty).every((c) => c.level === 0)).toBe(true);
  });
});

describe("buildOverallHeatmap", () => {
  const daily: HeatmapHabit = { id: "a", scheduleDays: [1, 2, 3, 4, 5, 6, 7], startDate: "2026-10-01", endDate: null };
  const weekdays: HeatmapHabit = { id: "b", scheduleDays: [1, 2, 3, 4, 5], startDate: "2026-10-05", endDate: null };
  const archived: HeatmapHabit = { id: "c", scheduleDays: [1, 2, 3, 4, 5, 6, 7], startDate: "2026-09-01", endDate: "2026-10-03" };
  const completions = groupCompletions([
    { habitId: "a", date: "2026-10-05" },
    { habitId: "b", date: "2026-10-05" },
    { habitId: "a", date: "2026-10-06" },
    { habitId: "c", date: "2026-10-02" },
  ]);
  const weeks = buildOverallHeatmap([daily, weekdays, archived], completions, TODAY);

  it("uses the share of scheduled habits done", () => {
    expect(cellOn(weeks, "2026-10-05")).toMatchObject({ done: 2, total: 2, level: 4 });
    expect(cellOn(weeks, "2026-10-06")).toMatchObject({ done: 1, total: 2, level: 2 });
    expect(cellOn(weeks, "2026-10-07")).toMatchObject({ done: 0, total: 2, level: 0 });
  });

  it("only counts habits that existed that day", () => {
    // 10-02: daily (since 10-01) + archived (until 10-03) → 1 of 2
    expect(cellOn(weeks, "2026-10-02")).toMatchObject({ done: 1, total: 2, level: 2 });
    // 10-04 (Sunday): only `daily` exists and is due
    expect(cellOn(weeks, "2026-10-04")).toMatchObject({ done: 0, total: 1 });
    expect(cellOn(weeks, "2026-08-31").state).toBe("inactive");
  });

  it("marks days where nothing was scheduled", () => {
    const onlyWeekdays = buildOverallHeatmap([{ ...weekdays, startDate: "2026-09-01" }], new Map(), TODAY);
    expect(cellOn(onlyWeekdays, "2026-10-04").state).toBe("unscheduled");
  });

  it("is all inactive without habits", () => {
    expect(flat(buildOverallHeatmap([], new Map(), TODAY)).every((c) => c.state === "inactive" || c.state === "future")).toBe(true);
  });
});

describe("monthLabels", () => {
  it("labels the column containing the 1st of each month", () => {
    const calendar = buildCalendar(TODAY);
    const labels = monthLabels(calendar);
    const october = labels.find((l) => l.label === "Spa")!;
    expect(calendar[october.column]).toContain("2026-10-01");
    expect(labels.length).toBeGreaterThanOrEqual(11);
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].column - labels[i - 1].column).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("describeCell", () => {
  const base = { date: "2026-10-07", level: 0 as const, done: 0, total: 1 };
  it("describes habit and overall cells in Lithuanian", () => {
    expect(describeCell({ ...base, state: "scheduled", done: 1, level: 4 }, "habit", TODAY)).toBe("Atlikta ✓");
    expect(describeCell({ ...base, state: "scheduled" }, "habit", TODAY)).toBe("Neatlikta");
    expect(describeCell({ ...base, date: TODAY, state: "scheduled" }, "habit", TODAY)).toBe("Dar neatlikta");
    expect(describeCell({ ...base, state: "scheduled", done: 2, total: 3 }, "overall", TODAY)).toBe("Atlikta 2 iš 3");
    expect(describeCell({ ...base, state: "unscheduled", bonus: true }, "habit", TODAY)).toBe("Atlikta papildomai");
  });
});
