"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toggleCompletionAction } from "@/actions/completions";
import { HabitIcon } from "@/components/habit-icon";
import { habitColorHex } from "@/lib/habit-colors";
import { formatTimes } from "@/lib/streaks";
import { cn } from "@/lib/utils";

export type TodayItem = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Done today (server state). */
  done: boolean;
  /** Current streak from the server (includes today if done). */
  streak: number;
  /** Whether today is scheduled, i.e. toggling it changes the streak. */
  scheduledToday: boolean;
  /** Extra secondary text, e.g. the schedule. */
  meta?: string;
};

/** Streak shown for an optimistic `done` value, without waiting for the server. */
function displayStreak(item: TodayItem, done: boolean): number {
  if (!item.scheduledToday) return item.streak;
  const withoutToday = item.streak - (item.done ? 1 : 0);
  return withoutToday + (done ? 1 : 0);
}

function StreakBadge({ value }: { value: number }) {
  return (
    <span
      key={value}
      className={cn(
        "inline-flex items-center gap-0.5 tabular-nums",
        value > 0 ? "font-medium text-orange-600 dark:text-orange-400" : "text-muted-foreground",
        value > 0 && "animate-in duration-300 zoom-in-50",
      )}
      aria-label={`Serija: ${formatTimes(value)} iš eilės`}
      title="Serija: kiek kartų iš eilės atlikta suplanuotomis dienomis"
    >
      <span aria-hidden className={value > 0 ? undefined : "opacity-50 grayscale"}>
        🔥
      </span>
      <span aria-hidden>{value}</span>
    </span>
  );
}

export function TodayList({
  items,
  date,
  showProgress = false,
}: {
  items: TodayItem[];
  date: string;
  showProgress?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(
    Object.fromEntries(items.map((item) => [item.id, item.done])) as Record<string, boolean>,
    (state, update: { id: string; done: boolean }) => ({ ...state, [update.id]: update.done }),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const done = !optimisticDone[id];
    setError(null);
    if (done) navigator.vibrate?.(10);
    startTransition(async () => {
      setOptimisticDone({ id, done });
      const result = await toggleCompletionAction({ habitId: id, date, done });
      if (!result.ok) setError(result.error);
    });
  }

  const doneCount = items.filter((item) => optimisticDone[item.id] ?? item.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="grid gap-2">
      {showProgress ? (
        <div className="mb-2">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {allDone ? "Viskas atlikta! 🎉" : "Šiandienos progresas"}
            </span>
            <span className="font-medium tabular-nums">
              {doneCount}/{items.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Atlikta šiandien"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={doneCount}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-300"
              style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-2">
        {items.map((item) => {
          const done = optimisticDone[item.id] ?? item.done;
          const hex = habitColorHex(item.color);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={done}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99] md:p-4",
                  done && "bg-accent/60",
                )}
              >
                <HabitIcon emoji={item.emoji} color={item.color} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-medium",
                      done && "text-muted-foreground line-through decoration-2",
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <StreakBadge value={displayStreak(item, done)} />
                    {item.meta ? <span className="truncate">{item.meta}</span> : null}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={done ? { backgroundColor: hex, borderColor: hex } : { borderColor: hex }}
                >
                  {done ? <Check className="size-5 text-white" strokeWidth={3} /> : null}
                </span>
                <span className="sr-only">{done ? "Atlikta" : "Neatlikta"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
