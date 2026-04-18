import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COACH = process.env.COACH_URL || "https://worker-production-c3a3.up.railway.app";
const DASHBOARD = process.env.DASHBOARD_URL || "https://web-production-fbd5f.up.railway.app";
const CONTEXTOS = process.env.CONTEXTOS_URL || "https://web-production-19efe.up.railway.app";
const ALJADA = process.env.ALJADA_URL || "https://al-jada-watch-production.up.railway.app";

const app = express();

// Internal ops dashboard — NEVER to be indexed. Header on every response.
app.use((_req, res, next) => {
  res.setHeader(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet, noimageindex"
  );
  next();
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /\n");
});

const mk = (target, prefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${prefix}`]: "" },
    logger: console,
  });

app.use("/api/coach", mk(COACH, "/api/coach"));
app.use("/api/dashboard", mk(DASHBOARD, "/api/dashboard"));
app.use("/api/contextos", mk(CONTEXTOS, "/api/contextos"));
app.use("/api/aljada", mk(ALJADA, "/api/aljada"));

app.get("/healthz", (_req, res) => res.json({ ok: true, ts: Date.now() }));

const DIST = path.join(__dirname, "dist");
app.use(express.static(DIST));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[hayhay-ops] listening on :${PORT}`);
  console.log(`  coach     → ${COACH}`);
  console.log(`  dashboard → ${DASHBOARD}`);
  console.log(`  contextos → ${CONTEXTOS}`);
});
