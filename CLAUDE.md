@AGENTS.md

# Habit Tracker (PWA)

Personal habit tracker, used daily on a phone. Mobile-first PWA with streaks,
a GitHub-style heatmap and push reminders.

## Stack

- Next.js 16 (App Router, `src/`, Turbopack) with **Cache Components** + Partial Prefetching enabled
- TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix base, `radix-nova` style)
- PostgreSQL on Neon via `@neondatabase/serverless` (HTTP driver) + Drizzle ORM / drizzle-kit
- Better Auth (email + password), Drizzle adapter, `nextCookies()` plugin
- date-fns + date-fns-tz, zod v4, web-push (VAPID), Vitest

## Commands

```bash
npm run dev           # dev server on http://localhost:3000
npm run build         # production build (must pass)
npm run lint          # eslint (must pass)
npm test              # vitest run (must pass)
npm run typecheck     # tsc --noEmit
npm run db:generate   # create a SQL migration from src/db/schema.ts
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:studio     # browse the DB
```

## Layout

- `src/app/(auth)/` – login / register (static, no session read)
- `src/app/(app)/` – authenticated pages; layout is a static shell + bottom nav
- `src/actions/` – Server Actions (all mutations)
- `src/db/schema.ts` – single source of truth for the DB; migrations in `drizzle/`
- `src/db/queries.ts` – read queries; every function takes the owner's `userId`
- `src/lib/` – auth, session (DAL), dates, validation (zod), pure domain logic
- `src/proxy.ts` – optimistic redirect to `/login` when no session cookie
- `tests/` – Vitest unit tests for pure functions

## Rules

- **Language:** UI text in Lithuanian; code, identifiers and comments in English.
- **Auth:** call `requireUser()` (`src/lib/session.ts`) in every Server Component, Server Action
  and Route Handler that touches user data, and always scope queries by `user.id`.
  Proxy is only an optimistic check.
- **Cache Components:** anything that reads the session/cookies/headers or the current time must
  render inside a `<Suspense>` boundary (keep it out of layouts). Do not add `"use cache"` to
  per-user data unless there is a clear invalidation story; after mutations call `refresh()`.
- **Mutations:** Server Actions only, input validated with zod (`src/lib/validation.ts`).
  Return `{ error | fieldErrors }` state for forms instead of throwing.
- **Dates:** a "day" is a `YYYY-MM-DD` string in the user's IANA time zone (`user.timezone`).
  Compute "today" on the server with `todayInTimeZone()`; never trust a client-supplied date
  and never use UTC day boundaries. Completions are unique per `(habit_id, date)`.
- **Domain logic** (streaks, heatmap, reminder windows) lives in pure functions under `src/lib/`
  with Vitest tests, including time zone / DST / empty-history edge cases.
- **DB changes:** edit `src/db/schema.ts`, run `npm run db:generate`, commit the SQL migration.
  Never edit an applied migration.
- **Dependencies:** keep them minimal; prefer the platform (e.g. hand-written service worker,
  `process.loadEnvFile`, CSS grid heatmap) over new packages.
- **Secrets** live in `.env.local` (git-ignored); every variable must be documented in `.env.example`.
- **Windows dev machine:** edit files with editor tools, not PowerShell `Set-Content`
  (it breaks UTF-8 Lithuanian characters).
- Before finishing a stage: `npm run build`, `npm run lint`, `npm test` must all pass.
