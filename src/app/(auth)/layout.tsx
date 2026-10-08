import { HABIT_COLORS } from "@/lib/habit-colors";

// Deterministic decorative pattern (integer hash, no Math.random → identical on server and client).
const DECOR_WEEKS = 26;
const DECOR_LEVELS = Array.from({ length: DECOR_WEEKS * 7 }, (_, i) => {
  const noise = (Math.imul(i + 1, 2654435761) >>> 0) / 2 ** 32; // 0..1
  const ramp = Math.floor(i / 7) / DECOR_WEEKS; // denser towards the right, like a habit taking hold
  const value = noise * 0.6 + ramp * 0.6;
  return value < 0.3 ? 0 : value < 0.5 ? 1 : value < 0.7 ? 2 : value < 0.85 ? 3 : 4;
});
const MIX = [0, 30, 55, 80, 100];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-muted/50 p-12 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl" aria-hidden>
            🔥
          </span>
          Įpročiai
        </div>
        <div>
          <div
            aria-hidden
            className="mb-8 grid w-fit gap-1"
            style={{ gridTemplateRows: "repeat(7, 0.875rem)", gridAutoFlow: "column", gridAutoColumns: "0.875rem" }}
          >
            {DECOR_LEVELS.map((level, i) => (
              <span
                key={i}
                className="rounded-[3px] bg-muted"
                style={
                  level
                    ? {
                        backgroundColor: `color-mix(in oklab, ${HABIT_COLORS.green.hex} ${MIX[level]}%, var(--muted))`,
                      }
                    : undefined
                }
              />
            ))}
          </div>
          <p className="max-w-md text-3xl font-semibold tracking-tight text-balance">
            Maži žingsniai kasdien virsta dideliais pokyčiais.
          </p>
          <p className="mt-3 max-w-md text-muted-foreground">
            Žymėk įpročius vienu paspaudimu, saugok savo serijas 🔥 ir matyk visus metus vienu
            žvilgsniu.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Asmeninis įpročių sekiklis</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <div className="text-4xl" aria-hidden>
              🔥
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Įpročiai</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
