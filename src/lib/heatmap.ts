import { addDays, type DateKey } from "@/lib/dates";
import { isoWeekday, isScheduledOn } from "@/lib/schedule";

export const HEATMAP_WEEKS = 52;

/** Intensity bucket, 0 = nothing done … 4 = everything done. */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

/**
 * - `future`: after today (rendered blank)
 * - `inactive`: the habit(s) did not exist yet / were archived
 * - `unscheduled`: habit exists but the day is not in its schedule
 * - `scheduled`: at least one habit was due
 */
export type HeatmapCellState = "future" | "inactive" | "unscheduled" | "scheduled";

export type HeatmapCell = {
  date: DateKey;
  state: HeatmapCellState;
  level: HeatmapLevel;
  /** Completed scheduled habits that day. */
  done: number;
  /** Scheduled habits that day. */
  total: number;
  /** Done on a day it was not scheduled (single-habit view only). */
  bonus?: boolean;
};

/** A column per week (Monday → Sunday). */
export type HeatmapWeek = HeatmapCell[];

export type HeatmapHabit = {
  id: string;
  scheduleDays: readonly number[];
  /** First day the habit exists (creation day in the user's zone). */
  startDate: DateKey;
  /** Day the habit was archived (exclusive), or null if active. */
  endDate: DateKey | null;
};

/**
 * Calendar grid ending with the week that contains `today`: `weeks` columns of
 * 7 date keys each, Monday first. Pure date-key arithmetic, so DST cannot shift it.
 */
export function buildCalendar(today: DateKey, weeks: number = HEATMAP_WEEKS): DateKey[][] {
  const currentMonday = addDays(today, 1 - isoWeekday(today));
  const firstMonday = addDays(currentMonday, -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(firstMonday, w * 7 + d)),
  );
}

export function isActiveOn(habit: HeatmapHabit, date: DateKey): boolean {
  return date >= habit.startDate && (habit.endDate === null || date < habit.endDate);
}

/** Maps a completion ratio to a 0–4 level. Any progress is at least level 1; only 100% is 4. */
export function levelForRatio(ratio: number): HeatmapLevel {
  if (!(ratio > 0)) return 0;
  if (ratio >= 1) return 4;
  if (ratio >= 2 / 3) return 3;
  if (ratio >= 1 / 3) return 2;
  return 1;
}

export function buildHabitHeatmap(
  habit: HeatmapHabit,
  completedDates: ReadonlySet<DateKey>,
  today: DateKey,
  weeks: number = HEATMAP_WEEKS,
): HeatmapWeek[] {
  return buildCalendar(today, weeks).map((week) =>
    week.map((date): HeatmapCell => {
      const completed = completedDates.has(date);
      if (date > today) return { date, state: "future", level: 0, done: 0, total: 0 };
      // A completion always wins, even outside the active window (e.g. edited history).
      if (!isActiveOn(habit, date) && !completed) {
        return { date, state: "inactive", level: 0, done: 0, total: 0 };
      }
      if (!isScheduledOn(habit.scheduleDays, date)) {
        return completed
          ? { date, state: "unscheduled", level: 4, done: 0, total: 0, bonus: true }
          : { date, state: "unscheduled", level: 0, done: 0, total: 0 };
      }
      return {
        date,
        state: "scheduled",
        level: completed ? 4 : 0,
        done: completed ? 1 : 0,
        total: 1,
      };
    }),
  );
}

/**
 * All habits combined: intensity = share of the habits scheduled that day that were done.
 * Only habits that existed that day count, so archiving or adding habits doesn't rewrite history.
 */
export function buildOverallHeatmap(
  habits: readonly HeatmapHabit[],
  completions: ReadonlyMap<string, ReadonlySet<DateKey>>,
  today: DateKey,
  weeks: number = HEATMAP_WEEKS,
): HeatmapWeek[] {
  return buildCalendar(today, weeks).map((week) =>
    week.map((date): HeatmapCell => {
      if (date > today) return { date, state: "future", level: 0, done: 0, total: 0 };
      const active = habits.filter((h) => isActiveOn(h, date));
      if (active.length === 0) return { date, state: "inactive", level: 0, done: 0, total: 0 };
      const due = active.filter((h) => isScheduledOn(h.scheduleDays, date));
      if (due.length === 0) return { date, state: "unscheduled", level: 0, done: 0, total: 0 };
      const done = due.filter((h) => completions.get(h.id)?.has(date)).length;
      return {
        date,
        state: "scheduled",
        level: levelForRatio(done / due.length),
        done,
        total: due.length,
      };
    }),
  );
}

/** Groups (habitId, date) rows into a lookup map. */
export function groupCompletions(
  rows: readonly { habitId: string; date: DateKey }[],
): Map<string, Set<DateKey>> {
  const map = new Map<string, Set<DateKey>>();
  for (const { habitId, date } of rows) {
    let set = map.get(habitId);
    if (!set) map.set(habitId, (set = new Set()));
    set.add(date);
  }
  return map;
}

const MONTHS_SHORT = ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rgp", "Rgs", "Spa", "Lap", "Gru"];

/**
 * Month labels for the column header: one label on the column that contains the 1st
 * of a month, skipped when it would collide with the previous label.
 */
export function monthLabels(calendar: readonly (readonly DateKey[])[]): { column: number; label: string }[] {
  const labels: { column: number; label: string }[] = [];
  calendar.forEach((week, column) => {
    const first = week.find((date) => date.endsWith("-01"));
    if (!first) return;
    const previous = labels.at(-1);
    if (previous && column - previous.column < 3) return;
    labels.push({ column, label: MONTHS_SHORT[Number(first.slice(5, 7)) - 1] });
  });
  return labels;
}

/** Short Lithuanian result text for a cell (used in the tooltip / tap info). */
export function describeCell(cell: HeatmapCell, kind: "habit" | "overall", today: DateKey): string {
  switch (cell.state) {
    case "future":
      return "";
    case "inactive":
      return kind === "habit" ? "Įprotis dar nebuvo sukurtas" : "Įpročių dar nebuvo";
    case "unscheduled":
      if (kind === "habit") return cell.bonus ? "Atlikta papildomai" : "Nesuplanuota";
      return "Nieko nesuplanuota";
    case "scheduled":
      if (kind === "habit") {
        if (cell.done) return "Atlikta ✓";
        return cell.date === today ? "Dar neatlikta" : "Neatlikta";
      }
      return `Atlikta ${cell.done} iš ${cell.total}`;
  }
}

/** Totals for the summary line: scheduled days in range and how many were completed. */
export function summarize(weeks: readonly HeatmapWeek[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const week of weeks) {
    for (const cell of week) {
      done += cell.done;
      total += cell.total;
    }
  }
  return { done, total };
}
