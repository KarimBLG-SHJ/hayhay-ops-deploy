# HayHay Ops

Real-time supervisor dashboard for the 9-agent HayHay bakery operations system (Sharjah, UAE).

## Quick start

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build for production

```bash
npm run build     # outputs dist/
npm start         # serves dist/ on $PORT
```

## Deploy on Railway

This project includes a multi-stage `Dockerfile` and a `railway.json` that tells Railway to use it. Push the folder to its own git repo, connect it to a Railway service, done.

## Data sources

See [CLAUDE.md](./CLAUDE.md) for the full list of upstream endpoints and the ones that still need to be built on `coach-telegram-bot` / `hayhay-dashboard-deploy`.

## Design reference

Based on the design handoff in `../design_handoff_hayhay_ops 2/`. Visual DNA: dark navy + gold/green/cyan "trading-desk / mission-control" aesthetic, JetBrains Mono + Inter typography, 3-column grid, animated count-up + pulse + draw-on chart.
