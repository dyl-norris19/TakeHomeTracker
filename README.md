# TakeHome Tracker

A small self-hosted web app for planning what's left of each paycheck. You tell it
when you get paid and what bills you have, then build a **card** for each pay period.
Every card shows your **take-home** for that period:

```
take-home = pay − recurring bills − one-off bills − savings
```

## What it does

- **Payday settings** – set your pay date and how often you're paid (weekly,
  biweekly, or monthly). The app works out the next pay date from there.
- **Recurring bills** – keep a reusable list of bills that hit every period
  (rent, phone, subscriptions, …).
- **Cards** – one per pay period. A card snapshots your recurring bills, adds any
  one-off bills for that period, and applies a savings rule (a percentage of pay
  or a flat amount). It then displays the savings amount, the take-home, and the
  pay date. Cards are listed by month.
- **Accounts** – email + password sign up / log in. Passwords are hashed with
  bcrypt; sessions are server-side (a hashed token in an `httpOnly` cookie, 30-day
  expiry with sliding renewal).

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | SvelteKit 2 / Svelte 5, `@sveltejs/adapter-node` |
| Language | TypeScript |
| UI | Tailwind CSS 3, shadcn-svelte components (bits-ui) |
| Database | SQLite via Drizzle ORM + `better-sqlite3` |
| Build | Vite 6 |
| Tooling | ESLint, SonarQube |

Migrations live in `drizzle/` and are applied automatically on server start
(`src/hooks.server.ts` → `runMigrations()`), so there's no separate migrate step
to run in dev or prod.

> This started life as a Vite SPA backed by AWS Lambda + DynamoDB. It was rewritten
> as a single SvelteKit app on SQLite so it can be self-hosted from one container.

## Requirements

- **Node 22 or newer**
- Docker + Docker Compose (for the container workflow)

## Running it

### Production (Docker)

```bash
cp .env.example .env
# edit .env and set ORIGIN to the URL you'll actually load in the browser,
# e.g. ORIGIN=https://takehome.example.com   (or http://localhost:9190 for a local test)

docker compose -f docker-compose.yml up -d --build
```

### Development

Local, no container:

```bash
npm install
npm run dev          # http://localhost:5173
```

Or with Docker (Vite dev server with hot reload, plus a SonarQube instance):

```bash
# .env needs VITE_ALLOWED_HOSTS set to the host you'll open the dev server on
docker compose up
```

`docker compose up` (no `-f`) merges `docker-compose.override.yml`, which brings up:

| Service | Port | Purpose |
| --- | --- | --- |
| `app` | 5173 | Vite dev server (hot reload) |
| `sonarqube` | 9000 | Code quality scanner |
| `app-prod` | 9190 | The production build (also started; needs `ORIGIN`) |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `build/` (run it with `node build`) |
| `npm run preview` | Preview the build with `vite preview` |
| `npm run check` | `svelte-check` type checking |
| `npm run lint` | ESLint |

## Environment variables

| Variable | Where | Default | Notes |
| --- | --- | --- | --- |
| `ORIGIN` | prod | — | **Required.** Public URL, scheme + host, no trailing slash. |
| `VITE_ALLOWED_HOSTS` | dev | — | Host the Vite dev server accepts. |
| `DATABASE_PATH` | any | `data/data.sqlite` | SQLite file location. Compose sets it to `/app/data/data.sqlite`. |
| `PORT` | prod | `3000` | Port the Node server listens on inside the container. |

`.env` is gitignored; `.env.example` is the checked-in template.

## Database changes

Schema is defined in `src/lib/server/db/schema/`. After editing it, generate a
migration:

```bash
npx drizzle-kit generate
```

This writes SQL to `drizzle/`. Commit it — it's applied automatically the next
time the server starts.

## Project layout

```
src/
  hooks.server.ts            session handling + run migrations on startup
  routes/
    +page.svelte             landing page
    login/  signup/          auth forms
    logout/                  POST endpoint, clears the session
    tracker/                 the app: payday settings, bills, cards
  lib/
    components/              UI (cards, forms, navbar) + shadcn-svelte in ui/
    server/
      auth.ts                sessions, cookies, password checks
      db/
        index.ts             better-sqlite3 + Drizzle connection
        migrate.ts           runMigrations()
        schema/  queries/  commands/
drizzle/                     generated migrations
data/                        SQLite database (gitignored)
```
