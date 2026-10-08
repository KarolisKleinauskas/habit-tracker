import type { DateKey } from "@/lib/dates";

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
  { value: 1, short: "Pr", long: "Pirmadienis" },
  { value: 2, short: "An", long: "Antradienis" },
  { value: 3, short: "Tr", long: "Trečiadienis" },
  { value: 4, short: "Kt", long: "Ketvirtadienis" },
  { value: 5, short: "Pn", long: "Penktadienis" },
  { value: 6, short: "Št", long: "Šeštadienis" },
  { value: 7, short: "Sk", long: "Sekmadienis" },
];

export const EVERY_DAY: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
export const WORKDAYS: Weekday[] = [1, 2, 3, 4, 5];
export const WEEKEND: Weekday[] = [6, 7];

/**
 * ISO weekday of a calendar day. Works on the date key itself (no time zone involved),
 * so it is the same for every user and immune to DST.
 */
export function isoWeekday(date: DateKey): Weekday {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return (day === 0 ? 7 : day) as Weekday;
}

export function isScheduledOn(scheduleDays: readonly number[], date: DateKey): boolean {
  return scheduleDays.includes(isoWeekday(date));
}

/** Sorted, de-duplicated, valid weekdays. */
export function normalizeSchedule(days: readonly number[]): Weekday[] {
  return [...new Set(days)]
    .filter((d): d is Weekday => Number.isInteger(d) && d >= 1 && d <= 7)
    .sort((a, b) => a - b);
}

function sameDays(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((d, i) => d === b[i]);
}

/** Human-readable schedule in Lithuanian, e.g. "Kasdien", "Pr, Tr, Pn". */
export function formatSchedule(days: readonly number[]): string {
  const normalized = normalizeSchedule(days);
  if (sameDays(normalized, EVERY_DAY)) return "Kasdien";
  if (sameDays(normalized, WORKDAYS)) return "Darbo dienomis";
  if (sameDays(normalized, WEEKEND)) return "Savaitgaliais";
  return normalized.map((d) => WEEKDAYS[d - 1].short).join(", ");
}
