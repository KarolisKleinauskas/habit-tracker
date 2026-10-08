import { AlarmClock, ChevronRight, Plus, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { unarchiveHabitAction } from "@/actions/habits";
import { DeleteHabitButton } from "@/components/habit-danger-actions";
import { HabitIcon } from "@/components/habit-icon";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { listHabits } from "@/db/queries";
import { todayInTimeZone } from "@/lib/dates";
import { loadHabitHistory } from "@/lib/habit-history";
import { formatSchedule } from "@/lib/schedule";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Įpročiai" };

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Įpročiai">
        <Button asChild className="h-10">
          <Link href="/habits/new">
            <Plus /> Naujas
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<HabitsSkeleton />}>
        <HabitList />
      </Suspense>
    </>
  );
}

async function HabitList() {
  const user = await requireUser();
  const [active, archived] = await Promise.all([
    listHabits(user.id),
    listHabits(user.id, { archived: true }),
  ]);
  const { streaks } = await loadHabitHistory(active, user.timezone, todayInTimeZone(user.timezone));

  return (
    <>
      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aktyvių įpročių nėra. Sukurk pirmą!
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 md:gap-3">
          {active.map((habit) => (
            <li key={habit.id}>
              <Link
                href={`/habits/${habit.id}`}
                className="flex h-full items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-accent/40 md:p-4"
              >
                <HabitIcon emoji={habit.emoji} color={habit.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{habit.name}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="tabular-nums"
                      title="Dabartinė serija"
                      aria-label={`Serija: ${streaks.get(habit.id)?.current ?? 0}`}
                    >
                      🔥 {streaks.get(habit.id)?.current ?? 0}
                    </span>
                    {formatSchedule(habit.scheduleDays)}
                    {habit.reminderTime ? (
                      <span className="inline-flex items-center gap-0.5">
                        <AlarmClock className="size-3.5" aria-label="Priminimas" />
                        {habit.reminderTime.slice(0, 5)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Archyvuoti ({archived.length})
          </h2>
          <ul className="grid gap-2 md:grid-cols-2 md:gap-3">
            {archived.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-xl border border-dashed p-3"
              >
                <HabitIcon emoji={habit.emoji} color={habit.color} className="opacity-60" />
                <Link
                  href={`/habits/${habit.id}`}
                  className="min-w-0 flex-1 truncate text-muted-foreground"
                >
                  {habit.name}
                </Link>
                <form action={unarchiveHabitAction.bind(null, habit.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Atkurti „${habit.name}“`}
                  >
                    <RotateCcw />
                  </Button>
                </form>
                <DeleteHabitButton habitId={habit.id} habitName={habit.name} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function HabitsSkeleton() {
  return (
    <div className="grid animate-pulse gap-2 md:grid-cols-2 md:gap-3" aria-busy="true" aria-label="Kraunama">
      <div className="h-17.5 rounded-xl bg-muted" />
      <div className="h-17.5 rounded-xl bg-muted" />
    </div>
  );
}
