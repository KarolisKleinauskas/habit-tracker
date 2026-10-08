import { formatInTimeZone } from "date-fns-tz";

/** Calendar day as "YYYY-MM-DD". */
export type DateKey = string;

export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(tz: string | null | undefined): string {
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isDateKey(value: string): value is DateKey {
  if (!DATE_KEY_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Calendar arithmetic on date keys. Uses UTC internally purely as a calendar,
 * so DST transitions in any zone cannot shift the result.
 */
export function addDays(date: DateKey, amount: number): DateKey {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + amount)).toISOString().slice(0, 10);
}

/** The calendar day an instant falls on in the given time zone. */
export function toDateKey(instant: Date, tz: string): DateKey {
  return formatInTimeZone(instant, normalizeTimeZone(tz), "yyyy-MM-dd");
}

/** The current calendar day in the given time zone. */
export function todayInTimeZone(tz: string, now: Date = new Date()): DateKey {
  return toDateKey(now, tz);
}
