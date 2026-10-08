import { and, asc, eq, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { completions, habits, type Habit } from "@/db/schema";
import type { DateKey } from "@/lib/dates";

// All queries take the owner's id explicitly; callers get it from requireUser().

export async function listHabits(
  userId: string,
  { archived = false }: { archived?: boolean } = {},
): Promise<Habit[]> {
  return db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        archived ? isNotNull(habits.archivedAt) : isNull(habits.archivedAt),
      ),
    )
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | undefined> {
  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  return habit;
}

/** Active and archived habits, for history views. */
export async function listAllHabits(userId: string): Promise<Habit[]> {
  return db
    .select()
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));
}

/**
 * Completion rows of the given habits up to `to` (inclusive). Streaks need the whole
 * history; for a personal tracker that is at most a few thousand small rows.
 */
export async function completionsUpTo(
  habitIds: string[],
  to: DateKey,
): Promise<{ habitId: string; date: DateKey }[]> {
  if (habitIds.length === 0) return [];
  return db
    .select({ habitId: completions.habitId, date: completions.date })
    .from(completions)
    .where(and(inArray(completions.habitId, habitIds), lte(completions.date, to)));
}
