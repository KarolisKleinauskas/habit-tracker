import { habitColorHex } from "@/lib/habit-colors";
import { cn } from "@/lib/utils";

/** Emoji on a soft tinted circle in the habit's color. */
export function HabitIcon({
  emoji,
  color,
  className,
}: {
  emoji: string;
  color: string;
  className?: string;
}) {
  const hex = habitColorHex(color);
  return (
    <span
      aria-hidden
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-2xl", className)}
      style={{ backgroundColor: `color-mix(in oklab, ${hex} 18%, transparent)` }}
    >
      {emoji}
    </span>
  );
}
