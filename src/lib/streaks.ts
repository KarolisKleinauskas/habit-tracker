import { addDays, toDateKey, type DateKey } from "@/lib/dates";
import { isScheduledOn } from "@/lib/schedule";

export type Streaks = {
  /** Consecutive scheduled occurrences completed, up to today. */
  current: number;
  /** Best run ever. */
  longest: number;
  /** Whether today is scheduled and already counted in `current`. */
  todayCounted: boolean;
};

export type StreakInput = {
  /** ISO weekdays the habit is due (1 = Monday … 7 = Sunday). */
  scheduleDays: readonly number[];
  /** Completed calendar days in the user's time zone. */
  completedDates: ReadonlySet<DateKey>;
  /** Today in the user's time zone. */
  today: DateKey;
  /** First day the habit existed; days before it never break a streak. */
  startDate?: DateKey;
};

const EMPTY: Streaks = { current: 0, longest: 0, todayCounted: false };

function earliest(dates: ReadonlySet<DateKey>): DateKey | undefined {
  let min: DateKey | undefined;
  for (const date of dates) if (min === undefined || date < min) min = date;
  return min;
}

/**
 * Streak rules:
 * - only scheduled days count; an unscheduled day neither breaks nor extends a streak
 *   (a "bonus" completion on such a day is ignored);
 * - today not done yet does not break the current streak until the day is over;
 * - all inputs are calendar-day keys in the user's zone, so DST cannot add or drop a day.
 */
export function calculateStreaks({
  scheduleDays,
  completedDates,
  today,
  startDate,
}: StreakInput): Streaks {
  const firstCompletion = earliest(completedDates);
  if (firstCompletion === undefined || scheduleDays.length === 0) return EMPTY;

  // Walk from the first relevant day to today.
  const from = startDate && startDate < firstCompletion ? startDate : firstCompletion;
  if (from > today) return EMPTY;

  let run = 0;
  let longest = 0;
  let todayCounted = false;

  for (let date = from; date <= today; date = addDays(date, 1)) {
    if (!isScheduledOn(scheduleDays, date)) continue;
    if (completedDates.has(date)) {
      run += 1;
      longest = Math.max(longest, run);
      if (date === today) todayCounted = true;
    } else if (date !== today) {
      // A missed past day breaks the run; a pending today does not.
      run = 0;
    }
  }

  return { current: run, longest, todayCounted };
}

/** Convenience wrapper that resolves "today" and the start day from instants in a time zone. */
export function calculateStreaksAt({
  scheduleDays,
  completedDates,
  createdAt,
  timezone,
  now = new Date(),
}: {
  scheduleDays: readonly number[];
  completedDates: ReadonlySet<DateKey>;
  createdAt: Date;
  timezone: string;
  now?: Date;
}): Streaks {
  return calculateStreaks({
    scheduleDays,
    completedDates,
    today: toDateKey(now, timezone),
    startDate: toDateKey(createdAt, timezone),
  });
}

/** Lithuanian plural: 1 kartas, 2 kartai, 10 kartų, 21 kartas, 22 kartai … */
export function pluralLt(n: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 11 || mod100 > 19)) return few;
  return many;
}

export function formatTimes(n: number): string {
  return `${n} ${pluralLt(n, ["kartas", "kartai", "kartų"])}`;
}
