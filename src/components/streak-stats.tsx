import { summarize, type HeatmapWeek } from "@/lib/heatmap";
import { formatTimes, type Streaks } from "@/lib/streaks";
import { cn } from "@/lib/utils";

function Tile({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 md:p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums md:text-3xl",
          highlight && "text-orange-600 dark:text-orange-400",
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export function StreakStats({ streaks, heatmap }: { streaks: Streaks; heatmap: HeatmapWeek[] }) {
  const { done, total } = summarize(heatmap);
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <Tile
        icon="🔥"
        label="Serija"
        value={String(streaks.current)}
        hint={streaks.current > 0 ? "iš eilės" : "pradėk šiandien"}
        highlight={streaks.current > 0}
      />
      <Tile
        icon="🏆"
        label="Rekordas"
        value={String(streaks.longest)}
        hint={streaks.longest > 0 && streaks.current >= streaks.longest ? "dabar! 🎉" : "geriausia serija"}
      />
      <Tile
        icon="📈"
        label="Per metus"
        value={`${rate} %`}
        hint={`${formatTimes(done)} iš ${total}`}
      />
    </div>
  );
}
