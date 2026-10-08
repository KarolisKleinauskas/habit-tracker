"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { updateTimeZoneSchema } from "@/lib/validation";

export type SettingsFormState = { ok?: boolean; error?: string };

export async function updateTimeZoneAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const currentUser = await requireUser();
  const parsed = updateTimeZoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neteisinga laiko zona" };
  }

  await db.update(user).set({ timezone: parsed.data.timezone }).where(eq(user.id, currentUser.id));
  refresh();
  return { ok: true };
}
