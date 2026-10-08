"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { completions, habits } from "@/db/schema";
import { addDays, todayInTimeZone } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { toggleCompletionSchema } from "@/lib/validation";

export type ToggleResult = { ok: true } | { ok: false; error: string };

/**
 * Marks a habit done / not done for `date`.
 * `date` is the day the client was showing; it must be today or yesterday in the
 * user's time zone, so a tap right after midnight still lands on the day on screen,
 * but arbitrary past/future days cannot be edited.
 */
export async function toggleCompletionAction(input: {
  habitId: string;
  date: string;
  done: boolean;
}): Promise<ToggleResult> {
  const user = await requireUser();
  const parsed = toggleCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neteisinga užklausa" };
  const { habitId, date, done } = parsed.data;

  const today = todayInTimeZone(user.timezone);
  if (date !== today && date !== addDays(today, -1)) {
    return { ok: false, error: "Diena jau pasikeitė. Atnaujink puslapį." };
  }

  const [habit] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id), isNull(habits.archivedAt)))
    .limit(1);
  if (!habit) return { ok: false, error: "Įprotis nerastas" };

  if (done) {
    await db.insert(completions).values({ habitId, date }).onConflictDoNothing();
  } else {
    await db
      .delete(completions)
      .where(and(eq(completions.habitId, habitId), eq(completions.date, date)));
  }

  refresh();
  return { ok: true };
}
