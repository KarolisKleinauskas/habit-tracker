# Habit Tracker 🔥

A mobile-first habit tracker PWA: one-tap daily check-ins, streaks that respect your schedule
and time zone, and a GitHub-style yearly heatmap. Built as a personal daily-use app.

> 🚧 Work in progress. The UI is currently in Lithuanian; an English locale, PWA install,
> push reminders and a public demo are on the roadmap below.

## Features

- **Today view**: habits scheduled for today, one tap to complete or undo, with optimistic UI
  and a progress bar
- **Flexible schedules**: every day or specific weekdays (e.g. Mon/Wed/Fri), emoji, colour,
  optional reminder time, archive instead of delete
- **Streaks**: current and longest streak, counting only scheduled days. Today stays "open"
  until midnight in *your* time zone, so an unfinished day never breaks the streak early
- **Heatmaps**: 52-week calendar per habit and overall (intensity = share of the day's habits
  done), built with CSS grid, no chart library. Tap or hover a day for details
- **Responsive**: bottom navigation on phones, sidebar and multi-column layouts on desktop,
  light/dark theme

## Interesting problems

- **Days are time-zone aware.** A completion is stored as a calendar day (`YYYY-MM-DD`) in the
  user's IANA zone, with a unique `(habit_id, date)` constraint. "Today" is always computed on
  the server; a short grace period lets a tap made just after midnight count for the day that
  was on screen.
- **DST-proof calendar maths.** Streak and heatmap logic works on date keys, never on
  timestamps, so 23- and 25-hour days can't skip or duplicate a day. Covered by tests for both
  EU transitions, leap years and zones from UTC−8 to UTC+14.
- **Next.js 16 Cache Components.** Static shells with per-user data streamed behind
  `<Suspense>`; session reads deferred with `connection()` so runtime prefetching doesn't
  abort in-flight DB queries.

## Tech stack

Next.js 16 (App Router, Server Actions, Cache Components) · TypeScript · Tailwind CSS v4 ·
shadcn/ui · PostgreSQL on Neon · Drizzle ORM · Better Auth · zod · date-fns · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate
npm run dev
```

Every environment variable is documented in [`.env.example`](.env.example).

| Command | |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | Vitest unit tests (streaks, heatmaps, dates, validation) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | SQL migration from `src/db/schema.ts` |

## Roadmap

- [x] Auth, habits CRUD, Today view
- [x] Streaks with tests
- [x] GitHub-style heatmaps
- [x] Responsive desktop layout
- [ ] Installable PWA with offline page
- [ ] Web Push reminders (VAPID + cron)
- [ ] English locale
- [ ] Public demo account
- [ ] Insights, past-day editing, quantity habits
- [ ] Offline check-ins, shareable profile card, data export
- [ ] CI with Playwright E2E tests
