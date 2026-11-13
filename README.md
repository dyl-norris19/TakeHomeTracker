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
  expiry with sliding renewal). Failed logins are rate limited: an account locks
  for 15 minutes after 5 bad attempts, and an IP address after 20, with repeat
  IP blocks escalating (15 min → 1 h → 4 h → 24 h → 7 days).
- **Password reset** – "Forgot your password?" emails a single-use link that
  expires after 10 minutes. Resetting logs the account out everywhere.

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
| `ADDRESS_HEADER` | prod | `X-Forwarded-For` (compose) | Header the reverse proxy puts the client IP in. Login rate limiting needs it. |
| `XFF_DEPTH` | prod | `1` (compose) | Number of trusted proxies in front of the app. |
| `SMTP_HOST` | any | — | SMTP server for password reset emails, e.g. `smtp.gmail.com`. |
| `SMTP_PORT` | any | `587` | `465` uses implicit TLS; anything else upgrades with STARTTLS. |
| `SMTP_USER` / `SMTP_PASS` | any | — | SMTP login. For Gmail, an app password. |
| `SMTP_FROM` | any | `SMTP_USER` | From address, e.g. `"TakeHome Tracker <noreply@example.com>"`. |

Without `SMTP_HOST` no reset emails are sent: production logs a warning, and the
dev server prints the reset link to the console instead.

The compose file assumes the app sits behind one reverse proxy. Without a proxy
the `X-Forwarded-For` header is missing, so per-IP login limits are skipped (a
warning is logged) and only the per-account limit applies.

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
    forgot-password/         request a password reset email
    reset-password/[token]/  set a new password from the emailed link
    logout/                  POST endpoint, clears the session
    tracker/                 the app: payday settings, bills, cards
  lib/
    components/              UI (cards, forms, navbar) + shadcn-svelte in ui/
    server/
      auth.ts                sessions, cookies, password checks
      throttle.ts            login rate limiting + lockouts
      password-reset.ts      reset tokens + applying a reset
      email.ts               SMTP sending
      db/
        index.ts             better-sqlite3 + Drizzle connection
        migrate.ts           runMigrations()
        schema/  queries/  commands/
drizzle/                     generated migrations
data/                        SQLite database (gitignored)
```
