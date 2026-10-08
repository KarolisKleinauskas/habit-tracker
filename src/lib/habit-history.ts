import { completionsUpTo } from "@/db/queries";
import type { Habit } from "@/db/schema";
import { toDateKey, type DateKey } from "@/lib/dates";
import {
  buildHabitHeatmap,
  buildOverallHeatmap,
  groupCompletions,
  type HeatmapHabit,
  type HeatmapWeek,
} from "@/lib/heatmap";
import { calculateStreaks, type Streaks } from "@/lib/streaks";

// Server-side glue: one query for all completions, then the pure builders.

export type HabitHistory = {
  /** Completed dates per habit id. */
  completions: Map<string, Set<DateKey>>;
  overallHeatmap: HeatmapWeek[];
  heatmaps: Map<string, HeatmapWeek[]>;
  streaks: Map<string, Streaks>;
};

export function toHeatmapHabit(habit: Habit, timezone: string): HeatmapHabit {
  return {
    id: habit.id,
    scheduleDays: habit.scheduleDays,
    startDate: toDateKey(habit.createdAt, timezone),
    endDate: habit.archivedAt ? toDateKey(habit.archivedAt, timezone) : null,
  };
}

export async function loadHabitHistory(
  habits: Habit[],
  timezone: string,
  today: DateKey,
): Promise<HabitHistory> {
  const rows = await completionsUpTo(
    habits.map((h) => h.id),
    today,
  );
  const completions = groupCompletions(rows);
  const heatmapHabits = habits.map((h) => toHeatmapHabit(h, timezone));

  const heatmaps = new Map<string, HeatmapWeek[]>();
  const streaks = new Map<string, Streaks>();
  for (const habit of heatmapHabits) {
    const dates = completions.get(habit.id) ?? new Set<DateKey>();
    heatmaps.set(habit.id, buildHabitHeatmap(habit, dates, today));
    streaks.set(
      habit.id,
      calculateStreaks({
        scheduleDays: habit.scheduleDays,
        completedDates: dates,
        today,
        startDate: habit.startDate,
      }),
    );
  }

  return {
    completions,
    overallHeatmap: buildOverallHeatmap(heatmapHabits, completions, today),
    heatmaps,
    streaks,
  };
}
