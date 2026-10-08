"use server";

import { and, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { requireUser } from "@/lib/session";
import {
  habitFormToObject,
  habitIdSchema,
  habitSchema,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation";

export type HabitFormState = { error?: string; fieldErrors?: FieldErrors };

export async function createHabitAction(
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await requireUser();
  const parsed = habitSchema.safeParse(habitFormToObject(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(habits.sortOrder) })
    .from(habits)
    .where(eq(habits.userId, user.id));

  await db.insert(habits).values({
    ...parsed.data,
    userId: user.id,
    sortOrder: (maxOrder ?? -1) + 1,
  });
  redirect("/habits");
}

export async function updateHabitAction(
  habitId: string,
  _prev: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await requireUser();
  if (!habitIdSchema.safeParse(habitId).success) return { error: "Įprotis nerastas" };
  const parsed = habitSchema.safeParse(habitFormToObject(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const updated = await db
    .update(habits)
    .set(parsed.data)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
    .returning({ id: habits.id });
  if (updated.length === 0) return { error: "Įprotis nerastas" };
  redirect("/habits");
}

async function setArchived(habitId: string, archived: boolean) {
  const user = await requireUser();
  if (!habitIdSchema.safeParse(habitId).success) return;
  await db
    .update(habits)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
}

export async function archiveHabitAction(habitId: string): Promise<void> {
  await setArchived(habitId, true);
  redirect("/habits");
}

export async function unarchiveHabitAction(habitId: string): Promise<void> {
  await setArchived(habitId, false);
  refresh();
}

export async function deleteHabitAction(habitId: string): Promise<void> {
  const user = await requireUser();
  if (!habitIdSchema.safeParse(habitId).success) return;
  // Completions and reminder log rows are removed by ON DELETE CASCADE.
  await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
  redirect("/habits");
}
