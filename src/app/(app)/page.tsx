import { formatInTimeZone } from "date-fns-tz";
import { lt } from "date-fns/locale";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Heatmap } from "@/components/heatmap";
import { PageHeader } from "@/components/page-header";
import { TodayList, type TodayItem } from "@/components/today-list";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllHabits } from "@/db/queries";
import type { Habit } from "@/db/schema";
import { todayInTimeZone } from "@/lib/dates";
import { HABIT_COLORS } from "@/lib/habit-colors";
import { loadHabitHistory } from "@/lib/habit-history";
import { formatSchedule, isScheduledOn } from "@/lib/schedule";
import { requireUser } from "@/lib/session";

const RECENT_WEEKS = 20;

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <Today />
    </Suspense>
  );
}

async function Today() {
  const user = await requireUser();
  const today = todayInTimeZone(user.timezone);
  const allHabits = await listAllHabits(user.id);
  const habits = allHabits.filter((h) => h.archivedAt === null);
  const history = await loadHabitHistory(allHabits, user.timezone, today);

  const toItem = (habit: Habit, meta?: string): TodayItem => ({
    id: habit.id,
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    done: history.completions.get(habit.id)?.has(today) ?? false,
    streak: history.streaks.get(habit.id)?.current ?? 0,
    scheduledToday: isScheduledOn(habit.scheduleDays, today),
    meta,
  });

  const scheduled = habits.filter((h) => isScheduledOn(h.scheduleDays, today));
  const unscheduled = habits.filter((h) => !isScheduledOn(h.scheduleDays, today));

  const dateLabel = formatInTimeZone(new Date(), user.timezone, "cccc, MMMM d 'd.'", {
    locale: lt,
  });

  return (
    <>
      <PageHeader title="Šiandien" description={dateLabel}>
        {habits.length > 0 ? (
          <Button asChild variant="outline" className="h-10 md:hidden">
            <Link href="/habits/new" aria-label="Naujas įprotis">
              <Plus />
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      {habits.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center md:p-12">
          <div className="text-4xl" aria-hidden>
            🌱
          </div>
          <p className="mt-2 font-medium">Dar neturi įpročių</p>
          <p className="mt-1 text-sm text-muted-foreground">Pradėk nuo vieno mažo įpročio.</p>
          <Button asChild className="mt-4 h-10">
            <Link href="/habits/new">
              <Plus /> Sukurti įprotį
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section aria-label="Šiandienos įpročiai">
            {scheduled.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Šiandien suplanuotų įpročių nėra. Poilsio diena! 😌
              </p>
            ) : (
              <TodayList
                date={today}
                showProgress
                items={scheduled.map((h) => toItem(h))}
              />
            )}

            {unscheduled.length > 0 ? (
              <details className="group mt-8">
                <summary className="cursor-pointer list-none text-sm text-muted-foreground select-none hover:text-foreground">
                  <span className="group-open:hidden">▸</span>
                  <span className="hidden group-open:inline">▾</span> Nesuplanuota šiandien (
                  {unscheduled.length})
                </summary>
                <p className="mt-2 mb-3 text-xs text-muted-foreground">
                  Atlikti papildomai galima, bet serijai 🔥 tai įtakos neturi.
                </p>
                <TodayList
                  date={today}
                  items={unscheduled.map((h) => toItem(h, formatSchedule(h.scheduleDays)))}
                />
              </details>
            ) : null}
          </section>

          <Card className="lg:sticky lg:top-10">
            <CardHeader>
              <CardTitle>Paskutinės {RECENT_WEEKS} savaičių</CardTitle>
              <CardAction>
                <Link
                  href="/stats"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Visa statistika <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Heatmap
                weeks={history.overallHeatmap.slice(-RECENT_WEEKS)}
                color={HABIT_COLORS.green.hex}
                kind="overall"
                today={today}
                label="Paskutinių savaičių kalendorius"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function TodaySkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Kraunama">
      <div className="mb-2 h-4 w-40 rounded bg-muted" />
      <div className="mb-8 h-8 w-32 rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-2">
          <div className="h-17.5 rounded-xl bg-muted" />
          <div className="h-17.5 rounded-xl bg-muted" />
          <div className="h-17.5 rounded-xl bg-muted" />
        </div>
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
