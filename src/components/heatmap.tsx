"use client";

import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useMemo, useRef, useState } from "react";
import { addDays, type DateKey } from "@/lib/dates";
import {
  describeCell,
  monthLabels,
  summarize,
  type HeatmapCell,
  type HeatmapLevel,
  type HeatmapWeek,
} from "@/lib/heatmap";
import { cn } from "@/lib/utils";

const CELL_MIN = "0.75rem"; // 12px on phones
const CELL_MAX = "1.375rem"; // 22px on wide screens
const LABEL_COLUMN = "1.5rem";
const GAP = "3px";
// Extends the sticky label background over the gap (and the gap below it).
const STICKY_COVER = `${GAP} 0 0 var(--card), ${GAP} ${GAP} 0 var(--card), 0 ${GAP} 0 var(--card)`;
const LEVEL_MIX: Record<HeatmapLevel, number> = { 0: 0, 1: 30, 2: 55, 3: 80, 4: 100 };
const WEEKDAY_LABELS = ["Pr", "", "Tr", "", "Pn", "", ""];

function formatDay(date: DateKey) {
  const [y, m, d] = date.split("-").map(Number);
  // "cccc" = standalone weekday ("antradienis", not "antradienį")
  return format(new Date(y, m - 1, d), "yyyy 'm.' MMMM d 'd.', cccc", { locale: lt });
}

function levelBackground(color: string, level: HeatmapLevel) {
  return level === 0
    ? undefined
    : `color-mix(in oklab, ${color} ${LEVEL_MIX[level]}%, var(--muted))`;
}

function cellClass(cell: HeatmapCell) {
  if (cell.level > 0) return "";
  if (cell.state === "scheduled") return "bg-muted ring-1 ring-inset ring-foreground/10";
  return "bg-muted/40";
}

export function Heatmap({
  weeks,
  color,
  kind,
  today,
  label,
}: {
  weeks: HeatmapWeek[];
  color: string;
  kind: "habit" | "overall";
  today: DateKey;
  /** Accessible name of the grid. */
  label: string;
}) {
  const cells = useMemo(() => new Map(weeks.flat().map((c) => [c.date, c])), [weeks]);
  const months = useMemo(() => monthLabels(weeks.map((w) => w.map((c) => c.date))), [weeks]);
  const summary = useMemo(() => summarize(weeks), [weeks]);
  const [selected, setSelected] = useState<DateKey>(today);
  const [hovered, setHovered] = useState<DateKey | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const shown = cells.get(hovered ?? selected) ?? cells.get(today);

  function focusDate(date: DateKey) {
    const cell = cells.get(date);
    if (!cell || cell.state === "future") return;
    setSelected(date);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    focusDate(addDays(selected, step));
  }

  return (
    // grid-cols-1 = minmax(0, 1fr): lets the scroller shrink so the calendar scrolls instead of overflowing
    <div className="grid grid-cols-1 gap-3">
      {/* row-reverse makes the browser start scrolled to the right end, without JS
          (a mount-time scrollLeft fails while streamed Suspense content is still hidden). */}
      <div className="-my-1 flex min-w-0 flex-row-reverse overflow-x-auto py-1 scrollbar-thin">
        <div
          ref={gridRef}
          role="group"
          aria-label={label}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHovered(null)}
          className="grid w-full pr-0.5 text-[10px] leading-none text-muted-foreground"
          style={{
            // Cells grow with the available width (desktop) down to a minimum (phones scroll).
            gridTemplateColumns: `${LABEL_COLUMN} repeat(${weeks.length}, minmax(${CELL_MIN}, ${CELL_MAX}))`,
            gridTemplateRows: "1rem",
            gridAutoRows: "auto",
            gap: GAP,
            minWidth: `calc(${LABEL_COLUMN} + ${weeks.length} * (${CELL_MIN} + ${GAP}))`,
          }}
        >
          {/* Sticky weekday labels stay visible while the weeks scroll underneath */}
          {/* The box-shadow covers the column gap so scrolled cells don't peek through */}
          <span
            aria-hidden
            className="sticky left-0 z-10 bg-card"
            style={{ gridColumn: 1, gridRow: 1, boxShadow: STICKY_COVER }}
          />
          {WEEKDAY_LABELS.map((day, i) => (
            <span
              key={i}
              aria-hidden
              className="sticky left-0 z-10 flex items-center bg-card"
              style={{ gridColumn: 1, gridRow: i + 2, boxShadow: STICKY_COVER }}
            >
              {day}
            </span>
          ))}
          {months.map(({ column, label: month }) => (
            <span
              key={column}
              aria-hidden
              className="whitespace-nowrap"
              style={{ gridColumn: `${column + 2} / span 3`, gridRow: 1 }}
            >
              {month}
            </span>
          ))}
          {weeks.map((week, w) =>
            week.map((cell, d) => {
              const position = { gridColumn: w + 2, gridRow: d + 2 };
              if (cell.state === "future") {
                return <span key={cell.date} aria-hidden className="aspect-square" style={position} />;
              }
              const description = describeCell(cell, kind, today);
              const isSelected = cell.date === selected;
              return (
                <button
                  key={cell.date}
                  type="button"
                  data-date={cell.date}
                  // Roving tabindex: one tab stop, arrow keys move between days.
                  tabIndex={isSelected ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={`${formatDay(cell.date)}: ${description}`}
                  title={`${cell.date} · ${description}`}
                  onClick={() => setSelected(cell.date)}
                  onMouseEnter={() => setHovered(cell.date)}
                  onFocus={() => setSelected(cell.date)}
                  className={cn(
                    "aspect-square w-full cursor-pointer rounded-[3px] outline-none transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-ring",
                    cellClass(cell),
                    cell.date === today && "ring-1 ring-foreground/50",
                    isSelected && "ring-2 ring-foreground",
                  )}
                  style={{ ...position, backgroundColor: levelBackground(color, cell.level) }}
                />
              );
            }),
          )}
        </div>
      </div>

      {/* Details of the hovered / tapped day */}
      <p aria-live="polite" className="min-h-5 text-sm">
        {shown ? (
          <>
            <span className="font-medium first-letter:uppercase">{formatDay(shown.date)}</span>
            <span className="text-muted-foreground"> · {describeCell(shown, kind, today)}</span>
          </>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Per {weeks.length} sav.: atlikta {summary.done} iš {summary.total}
          {summary.total > 0 ? ` (${Math.round((summary.done / summary.total) * 100)} %)` : ""}
        </span>
        <Legend color={color} kind={kind} />
      </div>
    </div>
  );
}

function Swatch({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("size-2.5 rounded-xs", className)} style={style} />;
}

function Legend({ color, kind }: { color: string; kind: "habit" | "overall" }) {
  if (kind === "habit") {
    return (
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Swatch className="bg-muted/40" /> Nesuplanuota
        </span>
        <span className="flex items-center gap-1">
          <Swatch className="bg-muted ring-1 ring-inset ring-foreground/10" /> Neatlikta
        </span>
        <span className="flex items-center gap-1">
          <Swatch style={{ backgroundColor: color }} /> Atlikta
        </span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      Mažiau
      <Swatch className="bg-muted ring-1 ring-inset ring-foreground/10" />
      {([1, 2, 3, 4] as const).map((level) => (
        <Swatch key={level} style={{ backgroundColor: levelBackground(color, level) }} />
      ))}
      Daugiau
    </span>
  );
}
