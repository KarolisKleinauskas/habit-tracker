import { z } from "zod";
import { isDateKey, isValidTimeZone } from "@/lib/dates";
import { HABIT_COLOR_KEYS } from "@/lib/habit-colors";
import { normalizeSchedule } from "@/lib/schedule";

export const timeZoneSchema = z
  .string()
  .trim()
  .refine(isValidTimeZone, { message: "Neteisinga laiko zona" });

export const signInSchema = z.object({
  email: z.email({ message: "Įvesk teisingą el. pašto adresą" }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Įvesk slaptažodį" }),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, { message: "Įvesk vardą" }).max(60, { message: "Per ilgas vardas" }),
  email: z.email({ message: "Įvesk teisingą el. pašto adresą" }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Slaptažodis turi būti bent 8 simbolių" })
    .max(128, { message: "Per ilgas slaptažodis" }),
  timezone: timeZoneSchema.catch("UTC"),
});

export const updateTimeZoneSchema = z.object({
  timezone: timeZoneSchema,
});

const segmenter = new Intl.Segmenter("lt", { granularity: "grapheme" });

/** Exactly one grapheme that contains an emoji (handles ZWJ sequences, skin tones, flags). */
export function isSingleEmoji(value: string): boolean {
  const graphemes = [...segmenter.segment(value)];
  return graphemes.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value);
}

export const habitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Įvesk pavadinimą" })
    .max(60, { message: "Pavadinimas per ilgas (iki 60 simbolių)" }),
  emoji: z.string().trim().refine(isSingleEmoji, { message: "Pasirink vieną emoji" }),
  color: z.enum(HABIT_COLOR_KEYS, { message: "Pasirink spalvą" }),
  scheduleDays: z
    .array(z.coerce.number().int().min(1).max(7))
    .min(1, { message: "Pasirink bent vieną dieną" })
    .transform((days) => normalizeSchedule(days)),
  reminderTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Neteisingas laikas" })
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
});

export type HabitInput = z.infer<typeof habitSchema>;

/** Reads the habit form; checkbox groups need getAll(). */
export function habitFormToObject(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    emoji: formData.get("emoji") ?? "",
    color: formData.get("color") ?? "",
    scheduleDays: formData.getAll("scheduleDays"),
    reminderTime: formData.get("reminderTime") ?? "",
  };
}

export const habitIdSchema = z.uuid();

export const toggleCompletionSchema = z.object({
  habitId: habitIdSchema,
  date: z.string().refine(isDateKey, { message: "Neteisinga data" }),
  done: z.boolean(),
});

/** Field-level errors keyed by input name (first message per field). */
export type FieldErrors = Partial<Record<string, string>>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    result[key] ??= issue.message;
  }
  return result;
}
