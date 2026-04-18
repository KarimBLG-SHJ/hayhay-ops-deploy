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

## Backend endpoints consumed (all live)

Every tile on the dashboard is wired to a real Railway endpoint via `src/api/adapters.ts`. Each adapter is independently try/catch'd — one source failing never poisons the snapshot.

| Tile | Endpoint | Owner |
|---|---|---|
| KPIs (CA, orders, AOV) | `GET /api/daily?date=…` | dashboard-deploy |
| Hero cumulative curve (06→20h) | `GET /api/daily` → `kpis.hour_revenue` | dashboard-deploy |
| Day Split (morning / afternoon) | `GET /api/daily` → `kpis.{morning,afternoon,evening}_revenue` | dashboard-deploy |
| Channel Mix (POS/Talabat/Shop/Keeta) | `GET /api/daily` → `kpis.channel_revenue` + `platform_revenue` | dashboard-deploy |
| Sector Yield (CA par catégorie) | `GET /api/daily` → `kpis.category_sales` | dashboard-deploy |
| Market Tape (Produits Live) | `GET /api/batch?date=…` | dashboard-deploy |
| Top VIP · Jour | `GET /api/top_customers?date=…&limit=5` | dashboard-deploy |
| Lifecycle Growth / Decline (Top 5) | `GET /api/lifecycle` | dashboard-deploy |
| Cron Queue + Agents live | `GET /cron/status` | coach |
| Context Score | `GET /forecast/daily?horizon_days=1` | contextos |
| Signal Radar + Agent Briefings + Ticker | `GET /slack/recent?limit=40&hours=168` | coach |

Channel remap: `/api/daily` returns `In-Shop / Delivery` with sub-platforms `Talabat / Noon / Keeta`. Adapter maps `In-Shop → POS`, `Talabat → Talabat`, `Noon → Shop`, `Keeta → Keeta`.

## Still to come (Phase D, optional)

- `GET /api/dashboard/snapshot` on coach — one-shot aggregator to replace the per-source fan-out (reduces round-trips from 7 to 1).
- SSE `GET /api/stream` on coach — push new signals in real-time instead of 60s polling. `src/api/useStream.ts` is a no-op in live mode today; the 60s snapshot poll refreshes the radar.

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
