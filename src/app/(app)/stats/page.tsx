import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HabitIcon } from "@/components/habit-icon";
import { Heatmap } from "@/components/heatmap";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllHabits } from "@/db/queries";
import { todayInTimeZone } from "@/lib/dates";
import { HABIT_COLORS, habitColorHex } from "@/lib/habit-colors";
import { loadHabitHistory } from "@/lib/habit-history";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Statistika" };

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Statistika" />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
    </>
  );
}

async function Stats() {
  const user = await requireUser();
  const today = todayInTimeZone(user.timezone);
  const habits = await listAllHabits(user.id);

  if (habits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Kai sukursi įpročių ir juos žymėsi, čia matysi savo metų kalendorių.
      </p>
    );
  }

  const history = await loadHabitHistory(habits, user.timezone, today);
  const active = habits.filter((h) => h.archivedAt === null);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Visi įpročiai</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap
            weeks={history.overallHeatmap}
            color={HABIT_COLORS.green.hex}
            kind="overall"
            today={today}
            label="Visų įpročių kalendorius"
          />
        </CardContent>
      </Card>

      {active.map((habit) => {
        const streaks = history.streaks.get(habit.id);
        return (
        <Card key={habit.id}>
          <CardHeader>
            <CardTitle>
              <Link href={`/habits/${habit.id}`} className="flex items-center gap-2 hover:underline">
                <HabitIcon emoji={habit.emoji} color={habit.color} className="size-8 text-lg" />
                <span className="min-w-0 flex-1 truncate">{habit.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm font-normal text-muted-foreground tabular-nums">
                  <span title="Dabartinė serija">🔥 {streaks?.current ?? 0}</span>
                  <span title="Ilgiausia serija" className="hidden sm:inline">
                    🏆 {streaks?.longest ?? 0}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Heatmap
              weeks={history.heatmaps.get(habit.id) ?? []}
              color={habitColorHex(habit.color)}
              kind="habit"
              today={today}
              label={`„${habit.name}“ kalendorius`}
            />
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4" aria-busy="true" aria-label="Kraunama">
      <div className="h-56 rounded-xl bg-muted" />
      <div className="h-56 rounded-xl bg-muted" />
    </div>
  );
}
