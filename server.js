import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COACH = process.env.COACH_URL || "https://worker-production-c3a3.up.railway.app";
const DASHBOARD = process.env.DASHBOARD_URL || "https://web-production-fbd5f.up.railway.app";
const CONTEXTOS = process.env.CONTEXTOS_URL || "https://web-production-19efe.up.railway.app";
const ALJADA = process.env.ALJADA_URL || "https://al-jada-watch-production.up.railway.app";

const app = express();

// ──────────────────────────────────────────────────────────────────────────
// Auth gate — one password, remembered 15 days via a signed HttpOnly cookie.
// No new dependency: HMAC via node:crypto, cookie parsed by hand.
// ──────────────────────────────────────────────────────────────────────────
const PASSWORD = process.env.OPS_PASSWORD || "hayhay";
const SECRET = process.env.OPS_SECRET || "dev-only-insecure-secret-change-me";
const SESSION_DAYS = 15;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const PUBLIC_PATHS = new Set(["/login", "/logout", "/healthz", "/robots.txt"]);

const sign = (exp) =>
  `${exp}.${crypto.createHmac("sha256", SECRET).update(String(exp)).digest("hex")}`;

const sessionValid = (val) => {
  if (!val) return false;
  const [exp, mac] = val.split(".");
  if (!exp || !mac) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(exp).digest("hex");
  return (
    mac.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  );
};

const readCookie = (req, name) => {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
};

const loginPage = (error = "") => `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>HayHay OS — Accès</title>
<style>
:root{color-scheme:dark}
body{margin:0;height:100vh;display:grid;place-items:center;background:#0b0e14;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#e8eaed}
form{background:#141923;padding:40px 36px;border-radius:16px;border:1px solid #232a37;
width:min(340px,90vw);box-shadow:0 20px 60px rgba(0,0,0,.5)}
h1{font-size:20px;margin:0 0 4px;letter-spacing:.5px}
p{margin:0 0 24px;color:#8b94a7;font-size:13px}
input{width:100%;box-sizing:border-box;padding:13px 14px;border-radius:10px;border:1px solid #2a3242;
background:#0b0e14;color:#e8eaed;font-size:15px;margin-bottom:14px}
input:focus{outline:none;border-color:#4c8dff}
button{width:100%;padding:13px;border:0;border-radius:10px;background:#4c8dff;color:#fff;
font-size:15px;font-weight:600;cursor:pointer}
button:hover{background:#3a7df0}
.err{color:#ff6b6b;font-size:13px;margin:-4px 0 14px}
</style></head><body>
<form method="POST" action="/login" autocomplete="off">
<h1>⬡ HayHay OS</h1><p>Accès réservé — entre ton mot de passe.</p>
${error ? `<div class="err">${error}</div>` : ""}
<input type="password" name="password" placeholder="Mot de passe" autofocus required>
<button type="submit">Entrer</button>
</form></body></html>`;

app.use(express.urlencoded({ extended: false }));

app.get("/login", (_req, res) => res.type("html").send(loginPage()));

app.post("/login", (req, res) => {
  const pw = Buffer.from(String((req.body && req.body.password) || ""));
  const ref = Buffer.from(PASSWORD);
  const ok = pw.length === ref.length && crypto.timingSafeEqual(pw, ref);
  if (!ok) return res.status(401).type("html").send(loginPage("Mot de passe incorrect."));
  const exp = Date.now() + SESSION_MS;
  res.setHeader(
    "Set-Cookie",
    `ops_session=${sign(exp)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  );
  res.redirect("/");
});

app.get("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "ops_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  res.redirect("/login");
});

app.use((req, res, next) => {
  if (PUBLIC_PATHS.has(req.path)) return next();
  // Mascot images are public assets (no business data) — Slack must fetch them
  // for image blocks in LNA/agent briefs, which can't carry the auth cookie.
  if (req.path.startsWith("/mascots/")) return next();
  if (sessionValid(readCookie(req, "ops_session"))) return next();
  if (req.method === "GET" && req.accepts("html")) return res.redirect("/login");
  return res.status(401).json({ error: "auth required" });
});

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

// Public Google Sheet feeding the COGS + Talabat margin modules.
const COGS_SHEET_ID = "1ELFrkcet-nJC5HrCx9aR-V9AY8VlIGVzroIGsoyXV9g";
const gvizPath = (tab) =>
  `/spreadsheets/d/${COGS_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
const mkSheet = (prefix, tab) =>
  createProxyMiddleware({
    target: "https://docs.google.com",
    changeOrigin: true,
    pathRewrite: () => gvizPath(tab),
    logger: console,
  });

app.use("/api/cogs", mkSheet("/api/cogs", "HayHay COGS per SKU"));
app.use("/api/talabat-margins", mkSheet("/api/talabat-margins", "Talabat - Product Margins"));

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
