import { Archive, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { archiveHabitAction, unarchiveHabitAction, updateHabitAction } from "@/actions/habits";
import { BackLink } from "@/components/back-link";
import { DeleteHabitButton } from "@/components/habit-danger-actions";
import { HabitForm } from "@/components/habit-form";
import { HabitIcon } from "@/components/habit-icon";
import { Heatmap } from "@/components/heatmap";
import { StreakStats } from "@/components/streak-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHabit } from "@/db/queries";
import { todayInTimeZone } from "@/lib/dates";
import { habitColorHex } from "@/lib/habit-colors";
import { loadHabitHistory } from "@/lib/habit-history";
import { formatSchedule } from "@/lib/schedule";
import { requireUser } from "@/lib/session";
import { habitIdSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Įprotis" };

export default function HabitPage({ params }: PageProps<"/habits/[id]">) {
  return (
    <>
      <BackLink href="/habits">Įpročiai</BackLink>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <HabitDetails params={params} />
      </Suspense>
    </>
  );
}

async function HabitDetails({ params }: { params: PageProps<"/habits/[id]">["params"] }) {
  const { id } = await params;
  if (!habitIdSchema.safeParse(id).success) notFound();

  const user = await requireUser();
  const habit = await getHabit(user.id, id);
  if (!habit) notFound();

  const archived = habit.archivedAt !== null;
  const today = todayInTimeZone(user.timezone);
  const history = await loadHabitHistory([habit], user.timezone, today);
  const heatmap = history.heatmaps.get(habit.id) ?? [];
  const streaks = history.streaks.get(habit.id) ?? { current: 0, longest: 0, todayCounted: false };

  return (
    <>
      <header className="mb-6 flex items-center gap-3 md:mb-8 md:gap-4">
        <HabitIcon emoji={habit.emoji} color={habit.color} className="md:size-14 md:text-3xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
            {habit.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatSchedule(habit.scheduleDays)}
            {archived ? " · archyvuotas" : ""}
          </p>
        </div>
      </header>

      <div className="mb-4">
        <StreakStats streaks={streaks} heatmap={heatmap} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Istorija</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap
            weeks={heatmap}
            color={habitColorHex(habit.color)}
            kind="habit"
            today={today}
            label={`„${habit.name}“ kalendorius`}
          />
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Redaguoti</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitForm
              key={habit.updatedAt.toISOString()}
              action={updateHabitAction.bind(null, habit.id)}
              submitLabel="Išsaugoti"
              defaultValues={{
                name: habit.name,
                emoji: habit.emoji,
                color: habit.color,
                scheduleDays: habit.scheduleDays,
                reminderTime: habit.reminderTime?.slice(0, 5) ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-10">
          <CardHeader>
            <CardTitle>Veiksmai</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {archived ? (
              <form action={unarchiveHabitAction.bind(null, habit.id)}>
                <Button type="submit" variant="outline" className="h-10 w-full">
                  <RotateCcw /> Atkurti iš archyvo
                </Button>
              </form>
            ) : (
              <form action={archiveHabitAction.bind(null, habit.id)}>
                <Button type="submit" variant="outline" className="h-10 w-full">
                  <Archive /> Archyvuoti
                </Button>
              </form>
            )}
            <p className="text-xs text-muted-foreground">
              Archyvuotas įprotis nerodomas „Šiandien“ sąraše, bet jo istorija išlieka.
            </p>
            <div className="mt-4 border-t pt-4">
              <DeleteHabitButton habitId={habit.id} habitName={habit.name} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
