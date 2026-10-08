"use client";

import { X } from "lucide-react";
import { useActionState, useLayoutEffect, useRef, useState } from "react";
import type { HabitFormState } from "@/actions/habits";
import { FormError } from "@/components/form-field";
import { HabitIcon } from "@/components/habit-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_HABIT_COLOR, HABIT_COLORS, HABIT_COLOR_KEYS } from "@/lib/habit-colors";
import { EVERY_DAY, WEEKDAYS, WEEKEND, WORKDAYS, type Weekday } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const EMOJI_SUGGESTIONS = [
  "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "✍️",
  "🚶", "🦷", "💊", "🧹", "🎸", "🌱", "📵", "☀️",
];

const SCHEDULE_PRESETS: { label: string; days: Weekday[] }[] = [
  { label: "Kasdien", days: EVERY_DAY },
  { label: "Darbo d.", days: WORKDAYS },
  { label: "Savaitgaliai", days: WEEKEND },
];

export type HabitFormValues = {
  name: string;
  emoji: string;
  color: string;
  scheduleDays: number[];
  reminderTime: string; // "HH:MM" or ""
};

const EMPTY_VALUES: HabitFormValues = {
  name: "",
  emoji: "💧",
  color: DEFAULT_HABIT_COLOR,
  scheduleDays: EVERY_DAY,
  reminderTime: "",
};

export function HabitForm({
  action,
  defaultValues = EMPTY_VALUES,
  submitLabel,
}: {
  action: (prev: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  defaultValues?: HabitFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // Controlled fields so values survive React's automatic form reset after a failed submit.
  const [name, setName] = useState(defaultValues.name);
  const [emoji, setEmoji] = useState(defaultValues.emoji);
  const [color, setColor] = useState(defaultValues.color);
  const [days, setDays] = useState<number[]>(defaultValues.scheduleDays);
  const [reminderTime, setReminderTime] = useState(defaultValues.reminderTime);
  const errors = state.fieldErrors ?? {};

  // Next keeps visited pages mounted (hidden via <Activity>). After a submit, reset the
  // draft when the page is hidden so "New habit" starts empty next time.
  const submittedRef = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (!submittedRef.current) return;
      submittedRef.current = false;
      setName(defaultValues.name);
      setEmoji(defaultValues.emoji);
      setColor(defaultValues.color);
      setDays(defaultValues.scheduleDays);
      setReminderTime(defaultValues.reminderTime);
    };
  }, [defaultValues]);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b),
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => {
        submittedRef.current = true;
      }}
      className="grid gap-6"
      noValidate
    >
      <FormError message={state.error} />

      <div className="flex items-center gap-3">
        <HabitIcon emoji={emoji || "❔"} color={color} className="size-14 text-3xl" />
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="name">Pavadinimas</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="pvz., Išgerti 2 l vandens"
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            className="h-11 text-base"
          />
          {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Ikona</legend>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-[repeat(8,2.75rem)]">
          {EMOJI_SUGGESTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-label={`Pasirinkti ${e}`}
              aria-pressed={emoji === e}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-xl transition-colors",
                emoji === e ? "bg-accent ring-2 ring-foreground" : "hover:bg-accent",
              )}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="emoji" className="shrink-0 text-muted-foreground">
            Arba įvesk savo:
          </Label>
          <Input
            id="emoji"
            name="emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="h-10 w-20 text-center text-xl"
            autoComplete="off"
            aria-invalid={errors.emoji ? true : undefined}
          />
        </div>
        {errors.emoji ? <p className="text-sm text-destructive">{errors.emoji}</p> : null}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Spalva</legend>
        <div className="flex flex-wrap gap-2.5">
          {HABIT_COLOR_KEYS.map((key) => (
            <label key={key} className="relative cursor-pointer">
              <input
                type="radio"
                name="color"
                value={key}
                checked={color === key}
                onChange={() => setColor(key)}
                className="peer sr-only"
              />
              <span className="sr-only">{HABIT_COLORS[key].label}</span>
              <span
                aria-hidden
                className="block size-9 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                style={{ backgroundColor: HABIT_COLORS[key].hex }}
              />
            </label>
          ))}
        </div>
        {errors.color ? <p className="text-sm text-destructive">{errors.color}</p> : null}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-medium">Kuriomis dienomis</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map(({ value, short, long }) => (
            <label key={value} className="cursor-pointer" title={long}>
              <input
                type="checkbox"
                name="scheduleDays"
                value={value}
                checked={days.includes(value)}
                onChange={() => toggleDay(value)}
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                {short}
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          {SCHEDULE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDays(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        {errors.scheduleDays ? (
          <p className="text-sm text-destructive">{errors.scheduleDays}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="reminderTime">Priminimas (neprivaloma)</Label>
        <div className="flex gap-2">
          <Input
            id="reminderTime"
            name="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="h-11 w-36 text-base"
            aria-invalid={errors.reminderTime ? true : undefined}
          />
          {reminderTime ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11"
              onClick={() => setReminderTime("")}
              aria-label="Pašalinti priminimą"
            >
              <X />
            </Button>
          ) : null}
        </div>
        {errors.reminderTime ? (
          <p className="text-sm text-destructive">{errors.reminderTime}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pranešimas ateis, jei iki to laiko įprotis nebus pažymėtas.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
        {pending ? "Saugoma…" : submitLabel}
      </Button>
    </form>
  );
}
