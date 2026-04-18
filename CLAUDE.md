# HayHay Ops — Command Deck

Real-time supervisor dashboard for the HayHay multi-agent operations platform (Sharjah, UAE).

## Stack

Vite 5 + React 18 + TypeScript 5 + Tailwind 3. Global CSS for dashboard styling (`src/styles/dashboard.css`), tokens in `src/styles/tokens.css` and mirrored in `tailwind.config.ts`.

## Architecture

- **UI components are pure** — they receive data via props, never fetch.
- **Data layer lives in `src/api/`** — `useSnapshot`, `useStream`, and `client.ts`.
- **Mock-first** — `VITE_USE_MOCK=true` serves `src/mocks/snapshot.mock.ts`. Set to `false` once the coach `/api/dashboard/snapshot` + SSE `/api/stream` endpoints are implemented.

## Env vars

```
VITE_USE_MOCK=true|false
VITE_COACH_URL=https://worker-production-c3a3.up.railway.app
VITE_DASHBOARD_URL=https://web-production-fbd5f.up.railway.app
VITE_CONTEXTOS_URL=https://web-production-19efe.up.railway.app
VITE_HUB_URL=https://hayhay-hub-production.up.railway.app
```

## Backend endpoints needed (not yet implemented)

The dashboard is currently served by mock data. To make it live, these endpoints must be added to `coach-telegram-bot` (aggregator) and `hayhay-dashboard-deploy` (fine-grained data):

| Endpoint | Owner | Purpose |
|---|---|---|
| `GET /api/dashboard/snapshot` | coach | One-shot aggregator returning full `Snapshot` type |
| `GET /api/stream` (SSE) | coach | Real-time push for Signal Radar + Ticker |
| `GET /api/hourly?date=YYYY-MM-DD` | dashboard-deploy | Cumulative AED per hour 06→20h for hero curve |
| `GET /slack/recent?channels=...&limit=50` | coach | Slack `conversations.history` wrapper for radar/briefings/ticker |
| `GET /api/top_customers?date=YYYY-MM-DD` | dashboard-deploy | Day's top VIPs (initials, amt, visits, tag) |
| `GET /api/sectors?date=YYYY-MM-DD` | dashboard-deploy | CA aggregated by category |
| `GET /api/lifecycle?stage=growth|decline&limit=5` | dashboard-deploy | Product momentum (delta %, last_sale, spark) |

Existing endpoints that are already live and can be adapted directly:

- `GET /cron/status` (coach) → Cron Queue
- `GET /slack/channels` (coach) → Supervisor uptime
- `GET /api/daily?date=...` (dashboard-deploy) → KPIs + Channel Mix (needs channel remap: In-Shop/Delivery → POS/Talabat/Shop/Keeta)
- `GET /api/batch?date=...` (dashboard-deploy) → Market Tape
- `GET /forecast/daily?horizon_days=1` (contextos) → Context Score (multiply `context_score_avg × 100`)
- `GET /events?limit=10` (contextos) → Queue

## Scripts

```bash
npm run dev       # vite dev server on :5173
npm run build     # tsc + vite build → dist/
npm run preview   # vite preview of the built bundle
npm start         # serve -s dist → production static (used by Railway)
```

## Railway

- **Prod URL:** https://hayhay-ops-production.up.railway.app
- **Project:** `hayhay-ops` on workspace `kemilall's Projects`
- **Health:** `GET /healthz` → `{ok: true, ts: <epoch>}`
- **GitHub:** https://github.com/KarimBLG-SHJ/hayhay-ops-deploy

Deployed via `Dockerfile` (multi-stage: node-alpine build then Express runtime). `railway.json` pins the Dockerfile builder. `server.js` serves `dist/` as static + proxies `/api/coach/*`, `/api/dashboard/*`, `/api/contextos/*` to their Railway services — single-origin = zero CORS.

Env vars available to override the proxy targets:
- `COACH_URL` (default `https://worker-production-c3a3.up.railway.app`)
- `DASHBOARD_URL` (default `https://web-production-fbd5f.up.railway.app`)
- `CONTEXTOS_URL` (default `https://web-production-19efe.up.railway.app`)
- `PORT` (set by Railway)

To redeploy after code changes: `git push` from this repo (Railway auto-deploys via GitHub) or `railway up --detach` from this folder.

## Routes (planned, not yet wired)

Today the dashboard is single-page (Command Deck). Sub-routes are listed in the design handoff README and will be added with react-router-dom v6 when backend endpoints for each sub-view are ready.

## Why another sub-project in `hayhay management/`

This is the **front-end** of the HayHay operations platform. The API layer lives separately (`hayhay-dashboard-deploy` = read models over Foodics; `coach-telegram-bot` = agent runtime + Slack bridge; `contextos-platform` = external context). Splitting keeps each concern independently deployable.
