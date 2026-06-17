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
VITE_HUB_KEY=<secret>   # baked at build (Dockerfile ARG); must equal hayhay-hub's HUB_KEY
OPS_PASSWORD=<password>  # login password (default "hayhay" if unset) — currently "hayhay2026"
OPS_SECRET=<random hex>  # HMAC key signing the 15-day session cookie
```

## Auth gate (server.js)

`server.js` puts a password gate in front of everything (SPA + all proxies).
No new dependency — HMAC via `node:crypto`, cookie parsed by hand.
- `GET /login` serves an inline login page; `POST /login` checks `OPS_PASSWORD`
  (timing-safe) → sets `ops_session` (HttpOnly, Secure, SameSite=Lax, **Max-Age 15 days**),
  signed `exp.hmac` with `OPS_SECRET`. `GET /logout` clears it.
- Public paths: `/login`, `/logout`, `/healthz`, `/robots.txt`. Everything else needs a valid
  cookie → unauth HTML GET redirects to `/login`, else 401 JSON.
- **The Hub** (separate Next.js app) re-protects itself: `ExternalFrame` appends `?k=VITE_HUB_KEY`
  to the hub iframe/popout; the hub's `src/middleware.ts` accepts the key, sets its own 15-day
  cookie, blocks keyless (public) visitors. ⚠️ In a cross-origin iframe the hub cookie is
  third-party — Chrome keeps it, Safari blocks it (use "Plein écran" → first-party cookie, full hub).

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

**Deploy (working method — 2026-06):** GitHub auto-deploy is currently NOT firing
(no Railway deployment is created on push to `main`). Deploy via CLI instead:

```bash
railway link -p 18d8ed44-8c51-45b5-bf30-d885beaaa1e2 -s hayhay-ops -e production
railway up --detach
```

- Project `hayhay-ops` (id `18d8ed44-8c51-45b5-bf30-d885beaaa1e2`), service `hayhay-ops` (id `7abc16ad-5854-4296-8523-f9bfb580be7b`), workspace **kemilall's Projects**. The project also holds a second service `hayhay-portal` — always target `hayhay-ops`.
- Still commit + push to GitHub for source history; just don't rely on it to deploy.
- Verify after deploy: prod `index.html` should reference the new `dist/assets/index-*.js` hash (compare with the local `npm run build` output), and `/healthz` returns `{ok:true}`.
- TODO: re-enable GitHub auto-deploy in Railway dashboard (service → Settings → Source → reconnect repo / enable Auto Deploy on `main`).

## Shell / routing (HayHay OS — Phase 1, done)

The app is now a multi-module shell, not a single page. Routing is a dependency-free
hash router (`src/shell/useHashRoute.ts`); `#/<id>` selects the view. Nav registry lives
in `src/shell/nav.ts` (`NAV_GROUPS`).

- **cockpit** (`#/cockpit`, default) — the original Command Deck. Fully wired.
- **native module views** (all live, Phase 2 done):
  - `sales` (`SalesModule`) + `context` (`ContextModule`) — from the snapshot, no new fetch.
  - `stock` (`StockModule`) — coach `/api/wastage_reconciliation` (reuses `ReconciliationPanel`).
  - `lifecycle` (`LifecycleModule`) — product lifecycle from dashboard `/api/lifecycle` (90-day matrix).
    Breakdown by **`phase`** (active/recovering/declining/zombie/discontinued/seasonal — richer than
    `status`), 7-day momentum lists, full catalogue table. **Client lifecycle (RFM/churn/6-stage funnel)
    is a placeholder** — needs a coach `GET /api/clients/lifecycle` endpoint (logic exists in
    `#hayhay-client-bot`, not yet exposed). That endpoint is the Coach IA session's job.
  - `cogs` (`CogsModule`) + `talabat` (`TalabatModule`) — read the public validated Google Sheet (CSV via gviz) through the `/api/cogs` and `/api/talabat-margins` proxies. Parser in `src/api/sheet.ts` (`useSheet` + quote-aware CSV + mixed comma/dot `num()`). Sheet id `1ELFrkcet-nJC5HrCx9aR-V9AY8VlIGVzroIGsoyXV9g`, tabs "HayHay COGS per SKU" / "Talabat - Product Margins". Sheet must stay "anyone with link can view". Junk legend/metadata rows filtered by non-numeric price.
  - `ModulePlaceholder` (`src/shell/ModulePlaceholder.tsx`) remains the fallback for any future `ready:false` module.
- **external items** (`reports`, `hub`, `b2b`) — embedded IN the shell via `src/shell/ExternalFrame.tsx` (iframe keyed by id). `embed:false` (hub — auth-gated Next.js) shows an in-shell launch card instead of a blank frame. `↗` / "Plein écran" pops out.
- **Coach IA column** (`src/shell/CoachColumn.tsx`) — persistent right-hand grid column (open by default, state in `localStorage`), embeds coach chat-ui via `/api/coach/chat-ui`. It's a real grid track (`.app.coach-open` adds a 380px column) so it pushes content instead of overlaying; the iframe is mounted once and only hidden when collapsed, so the conversation survives route changes + collapse/expand. Collapses to the `.coach-fab`. Below 1200px it reverts to a floating overlay and frees the track. (Replaced the old FAB-only `CoachDock`.)

Sheet proxies live in BOTH `vite.config.ts` (dev) and `server.js` (prod) → `https://docs.google.com` gviz CSV.

Phase 3 (optional) = `/cockpit/summary` aggregation route (Coach IA session, not here) + SSO + mobile.

## Why another sub-project in `hayhay management/`

This is the **front-end** of the HayHay operations platform. The API layer lives separately (`hayhay-dashboard-deploy` = read models over Foodics; `coach-telegram-bot` = agent runtime + Slack bridge; `contextos-platform` = external context). Splitting keeps each concern independently deployable.
