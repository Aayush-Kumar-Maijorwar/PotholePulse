# PotholePulse — Municipal Road Hazard Monitoring Portal (v3)

A Next.js (App Router) rebuild of the PotholePulse hackathon demo: a
civic-styled dashboard for reviewing AI-flagged road hazard reports
(potholes, cracks, pedestrian obstacles) around Raipur/Durg, Chhattisgarh.

This is a demo build — see **Out of scope** below for what's intentionally
left out.

## Stack

- Next.js App Router, plain JavaScript (no TypeScript)
- Leaflet + Leaflet.heat for the map (pins / point heat map / zone overview)
- Vercel KV for persistence, with an automatic in-memory fallback for local dev
- Canvas-generated mock "captured photos" (no external image hosting)

## Project structure

```
/app
  /login/page.js            login screen
  /dashboard/page.js        main dashboard (server-side cookie check)
  /api/login/route.js       POST: validate credentials, set session cookie
  /api/logout/route.js      POST: clear session cookie
  /api/reports/route.js     GET: list reports · POST: create one (used by Simulate)
  /api/reports/[id]/route.js  PATCH: update a report's status
  globals.css                shared civic styling
/lib
  store.js                   data access layer (Vercel KV + in-memory fallback)
  zones.js                   zone polygon definitions + point-in-zone logic
  mockImage.js                canvas-based mock photo generator (client-side)
  constants.js, format.js
/components
  Dashboard.js, Header.js, StatsStrip.js, MapView.js,
  ReportList.js, DetailPanel.js, ZoneLegend.js, LoginForm.js, Seal.js
```

## Running locally (zero cloud setup)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`.

**Demo credentials:** `admin` / `admin123` (also shown on the login screen itself).

No environment variables are required for local development. `lib/store.js`
checks for `KV_REST_API_URL` / `KV_REST_API_TOKEN` and, if they're not set,
transparently falls back to an in-memory report list that's seeded with 12
mock reports on first read. That list resets whenever the dev server
restarts — that's expected for local dev.

If you do want to test against a real KV store locally, copy
`.env.local.example` to `.env.local` and fill in the values from your
Vercel project's Storage tab.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel (New Project → your repo).
   No build configuration is needed — it's a standard Next.js app.
2. In the Vercel dashboard, go to **Storage → Create Database → KV**, then
   **Connect Project** to attach it to this project. This automatically
   injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc. as environment
   variables for your deployments — no manual copying needed.
3. Deploy. The app seeds the KV store with mock reports on its first read,
   and every "Simulate Incoming Alert" / status-update write persists there —
   so anyone opening the deployed URL (a judge on their own phone, for
   example) sees the same data as your laptop, live.

There's no code that assumes `localhost` or a fixed port — all API calls
are relative (`/api/...`), so the same code runs identically locally and
on the deployed Vercel URL.

## Key behaviors

- **Login** — `POST /api/login` checks the hardcoded `admin`/`admin123`
  credentials and sets a plain httpOnly `pp_session` cookie. `/app/dashboard`
  checks that cookie server-side and redirects to `/login` if it's missing.
  **This is demo-only auth** — see the comment in `app/api/login/route.js`.
- **Simulate Incoming Alert** — calls `POST /api/reports` (no body), which
  generates a random report server-side, persists it, and returns it. The
  dashboard then plays the pin-drop pulse, list-row flash, stat-card pulse,
  and bell-badge bounce around that returned report.
- **Status changes require Submit** — changing the dropdown in the detail
  panel only stages a value locally; nothing is saved until you click
  **Submit**, which calls `PATCH /api/reports/[id]`. Closing the panel or
  switching reports without submitting discards the staged change.
- **Mock photos** — generated entirely with `<canvas>` in
  `lib/mockImage.js`, seeded by each report's `imageSeed` so reopening the
  same report always renders the same photo.
- **Zone Overview** — `lib/zones.js` defines 8 rough rectangular zones
  around Raipur/Durg; report counts per zone are recomputed from whatever
  reports are currently loaded, including freshly simulated ones.

## Login page background photo

`public/images/login-bg.png` is an aerial photo of an Indian highway
interchange, shown behind the login card under a white translucent wash.
To swap it for a different photo, replace that file (or drop one at
`public/images/login-bg.jpg` instead — both paths are wired up). If
neither file is present, the page automatically falls back to a
self-contained SVG highway illustration
(`public/images/highway-fallback.svg`) so it never looks broken.

## Out of scope

- No real user accounts or database beyond the single hardcoded admin login.
- No real photo upload/storage, no ESP32/hardware integration.
- No real SMS/email notifications — the bell badge is the only "notification" surface.
- Session handling is a simple plaintext cookie check, not production auth.
