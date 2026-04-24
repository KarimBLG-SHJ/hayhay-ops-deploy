import type {
  AgentBriefing,
  AgentCode,
  ChannelMix,
  ContextSnapshot,
  ContextTag,
  CronQueueItem,
  KpiSnapshot,
  LifecycleItem,
  MarketTapeRow,
  SectorYieldRow,
  Severity,
  SignalItem,
  Snapshot,
  SupervisorSnapshot,
  TickerItem,
  TopVip,
} from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import type { AlJadaScore, IaAccuracy } from "../types";
import { ALJADA, COACH, CONTEXTOS, DASHBOARD, fetchJson, todayUAE } from "./client";

// ---- Dashboard /api/daily ----
interface DailyResponse {
  date: string;
  kpis: {
    revenue: number;
    orders: number;
    aov: number;
    delivery_pct: number;
    channel_revenue: Record<string, number>;
    platform_revenue?: Record<string, number>;
    platform_orders?: Record<string, number>;
    category_sales?: Record<string, { qty: number; revenue: number }>;
    hour_revenue?: Record<string, number>;
    hour_orders?: Record<string, number>;
    morning_revenue?: number;
    afternoon_revenue?: number;
    evening_revenue?: number;
  };
  top_by_qty?: Array<{
    product_id: string;
    name: string;
    category: string;
    qty: number;
    revenue: number;
  }>;
  top_products?: Array<{
    product_id: string;
    name: string;
    category: string;
    qty: number;
    revenue: number;
  }>;
}

async function fetchDaily(date: string): Promise<DailyResponse | null> {
  try {
    return await fetchJson<DailyResponse>(`${DASHBOARD}/api/daily?date=${date}`);
  } catch (e) {
    console.warn("[daily] fetch failed", e);
    return null;
  }
}

function kpisFromDaily(d: DailyResponse): Partial<KpiSnapshot> {
  const target = 25000;
  const pct = d.kpis.revenue / target;
  return {
    ca_today: {
      value: Math.round(d.kpis.revenue),
      currency: "AED",
      target,
      pct,
      delta_vs_yesterday_pct: 0,
    },
    orders: { value: d.kpis.orders, delta_vs_yesterday: 0 },
    avg_ticket: { value: Math.round(d.kpis.aov * 10) / 10, currency: "AED" },
  };
}

function sectorsFromDaily(d: DailyResponse): SectorYieldRow[] {
  const cats = d.kpis.category_sales || {};
  const rows = Object.entries(cats)
    .map(([name, v]) => ({ name: name.toUpperCase(), ca: Math.round(v.revenue), tx: v.qty }))
    .filter((r) => r.ca > 0)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5);
  return rows;
}

function channelMixFromDaily(d: DailyResponse): ChannelMix {
  const rev = d.kpis.channel_revenue || {};
  const plat = d.kpis.platform_revenue || {};
  const inShop = rev["In-Shop"] || 0;
  const talabat = plat["Talabat"] || 0;
  const noon = plat["Noon"] || 0;
  const keeta = plat["Keeta"] || 0;
  const total = inShop + talabat + noon + keeta || 1;
  return {
    POS: inShop / total,
    Talabat: talabat / total,
    Shop: noon / total,
    Keeta: keeta / total,
  };
}

// ---- Coach /cron/status ----
interface CronStatusRow {
  fn: string;
  channel: string;
  label: string;
  last_run: string | null;
  expected_today: boolean;
  ran_today: boolean;
  compliant: boolean;
}

interface CronStatusResponse {
  status: Record<string, CronStatusRow>;
}

async function fetchCronStatus(): Promise<CronStatusResponse | null> {
  try {
    return await fetchJson<CronStatusResponse>(`${COACH}/cron/status`);
  } catch (e) {
    console.warn("[cron] fetch failed", e);
    return null;
  }
}

function parseHourFromLabel(label: string): string {
  // "IMAK — Briefing matin (7h UAE)" → "07:00"
  const m = label.match(/\((\d{1,2})h(\d{0,2})/i);
  if (m) {
    const h = m[1].padStart(2, "0");
    const min = (m[2] || "00").padEnd(2, "0");
    return `${h}:${min}`;
  }
  return "--:--";
}

function cronQueueFromStatus(r: CronStatusResponse): CronQueueItem[] {
  // HayHay Ops is HayHay-only — BDouin/IMAK crons must not appear here.
  const items = Object.values(r.status).filter(
    (it) => !(it.channel || "").toLowerCase().startsWith("bdouin-") && !/imak/i.test(it.label),
  );
  const seen = new Set<string>();
  const out: CronQueueItem[] = [];
  for (const it of items) {
    const label = it.label.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const at = parseHourFromLabel(it.label);
    const key = `${label}|${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ at, label, kind: "CRON" as const });
  }
  // Sort: real times first (ascending), placeholders --:-- at the bottom.
  out.sort((a, b) => {
    if (a.at === "--:--" && b.at !== "--:--") return 1;
    if (b.at === "--:--" && a.at !== "--:--") return -1;
    return a.at.localeCompare(b.at);
  });
  return out;
}

function supervisorFromStatus(r: CronStatusResponse, base: SupervisorSnapshot): SupervisorSnapshot {
  const items = Object.values(r.status).filter(
    (it) => !(it.channel || "").toLowerCase().startsWith("bdouin-") && !/imak/i.test(it.label),
  );
  const ran = items.filter((x) => x.ran_today).length;
  return {
    uptime_session_s: base.uptime_session_s,
    api_calls: base.api_calls,
    slack_posts: ran * 3,
  };
}

function briefingsFromStatus(r: CronStatusResponse): AgentBriefing[] {
  const items = Object.values(r.status).filter(
    (it) => !(it.channel || "").toLowerCase().startsWith("bdouin-") && !/imak/i.test(it.label),
  );
  const agentOf = (ch: string) => {
    if (ch.includes("foodics")) return "FOO" as const;
    if (ch.includes("sop")) return "SOP" as const;
    if (ch.includes("supervis")) return "SUP" as const;
    if (ch.includes("imak") || ch.includes("print")) return "PRD" as const;
    if (ch.includes("kpi")) return "MKT" as const;
    if (ch.includes("context")) return "CTX" as const;
    if (ch.includes("coach")) return "SVR" as const;
    return "SVR" as const;
  };
  const hhmm = (s: unknown): string => {
    if (typeof s !== "string") return "—";
    const m = s.match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "—";
  };
  return items
    .filter((it) => it.ran_today)
    .map((it) => ({
      agent: agentOf(it.channel),
      text: `${it.label} · ${hhmm(it.last_run)}`,
    }))
    .slice(0, 12);
}

// ---- ContextOS /forecast/daily ----
interface ForecastRow {
  date_local: string;
  day_of_week: number;
  is_weekend: number;
  is_ramadan: number;
  is_school_break: number;
  is_school_day: number;
  is_salary_period: number;
  is_salary_peak: number;
  temp_c_max: number;
  humidity_avg: number;
  uv_index_max: number;
  context_score_avg: number;
  context_score_max: number;
  major_event_score: number;
}

async function fetchForecast(): Promise<ForecastRow | null> {
  try {
    const arr = await fetchJson<ForecastRow[]>(`${CONTEXTOS}/forecast/daily?horizon_days=1`);
    return arr[0] || null;
  } catch (e) {
    console.warn("[forecast] fetch failed", e);
    return null;
  }
}

function contextFromForecast(f: ForecastRow, nSignals: number): ContextSnapshot {
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const tags: ContextTag[] = [
    { k: dayNames[f.day_of_week - 1] || "—", on: true },
    { k: `${Math.round(f.temp_c_max)}°C`, on: f.temp_c_max > 38 },
    { k: "Weekend", on: f.is_weekend === 1 },
    { k: "Jour paye", on: f.is_salary_period === 1 },
    { k: "Ramadan", on: f.is_ramadan === 1 },
    { k: "Vac. école", on: f.is_school_break === 1 },
  ];
  return {
    density: Math.round(f.context_score_avg * 1000) / 10,
    n_signals: nSignals,
    tags,
  };
}

// ---- Dashboard /api/batch ----
interface BatchProduct {
  name: string;
  batch_qty?: number;
  opening?: number;
  evening_balance?: number;
  sold_qty?: number;
  foodics_reconcile?: number;
  waste_qty?: number;
  sell_through_pct?: number;
}

interface BatchSummary {
  total_batch_qty?: number;
  total_waste_qty?: number;
  total_waste_aed?: number;
  waste_rate_pct?: number;
}

interface BatchResponse {
  date: string;
  available?: boolean;
  products?: BatchProduct[];
  summary?: BatchSummary;
}

async function fetchBatch(date: string): Promise<BatchResponse | null> {
  try {
    return await fetchJson<BatchResponse>(`${DASHBOARD}/api/batch?date=${date}`);
  } catch (e) {
    console.warn("[batch] fetch failed", e);
    return null;
  }
}

/**
 * TOP 10 produits vendus en live aujourd'hui (source: /api/daily top_by_qty).
 * Pour chaque produit, on tente un matching flou sur /api/batch pour afficher
 * ce qui avait été planifié (batch_qty). Si pas de match → range = "—".
 *
 * Le "sold" est le vrai live Foodics (rafraîchi à chaque poll). Le "planned"
 * vient du batch tracker rempli par l'équipe le matin.
 */
function marketTapeFromLive(daily: DailyResponse, batch: BatchResponse | null): MarketTapeRow[] {
  const topList = daily.top_by_qty || daily.top_products || [];
  const batchProducts = batch?.products || [];

  // Normalize names for fuzzy matching
  const norm = (s: string) =>
    (s || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim();

  const findBatch = (foodicsName: string): BatchProduct | undefined => {
    const target = norm(foodicsName);
    if (!target) return undefined;
    // Exact match first
    let hit = batchProducts.find((b) => norm(b.name) === target);
    if (hit) return hit;
    // Bidirectional substring (both ways, pick longer common prefix)
    const targetTokens = target.split(" ").filter((t) => t.length > 2);
    hit = batchProducts.find((b) => {
      const bn = norm(b.name);
      if (!bn) return false;
      return targetTokens.some((t) => bn.includes(t)) && bn.split(" ").some((bt) => target.includes(bt));
    });
    return hit;
  };

  return topList.slice(0, 10).map((t) => {
    const match = findBatch(t.name);
    const planned = match ? Math.round((match.batch_qty || 0) + (match.opening || 0)) : 0;
    const sold = Math.round(t.qty);
    // Range: if planned > 0, show planned ± 15%. If no planned, show "—".
    const low = planned > 0 ? Math.max(0, Math.round(planned * 0.85)) : 0;
    const high = planned > 0 ? Math.round(planned * 1.15) : 0;
    const mid = planned > 0 ? Math.round((low + high) / 2) : sold;
    const delta = planned > 0 ? sold - mid : 0;
    return {
      product: t.name,
      range_low: low,
      range_high: high,
      actual: sold,
      delta,
    };
  });
}

// ---- Dashboard /api/lifecycle ----
interface LifecycleProduct {
  primary: string;
  category?: string;
  is_active: boolean;
  status?: string;
  phase?: string;
  trend: string;          // '++' | '+' | '=' | '-' | '--' | '·'
  trend_detail: string;   // e.g. "+116% (1.4 → 3.0 u/j)"
  delta_pct: number | null;
  last_sale: string;
  total_qty: number;
  avg_recent_30d?: number | null;
  avg_prior_30d?: number | null;
  days_silent?: number;
  daily: [string, number][];
}

interface LifecycleResponse {
  generated_at: string;
  db_end: string;
  products: LifecycleProduct[];
}

async function fetchLifecycle(): Promise<LifecycleResponse | null> {
  try {
    return await fetchJson<LifecycleResponse>(`${DASHBOARD}/api/lifecycle`);
  } catch (e) {
    console.warn("[lifecycle] fetch failed", e);
    return null;
  }
}

/**
 * Build a sparkline of the last N CALENDAR days ending at `endIso` (typically
 * `lifecycle.db_end`, i.e. the last day the daily matrix was refreshed).
 * Days with no sale are filled with 0 — so a product that hasn't been sold
 * for 5 days will show 5 trailing zero bars, making the silence visible.
 */
function sparkFromDaily(daily: [string, number][], endIso: string, n: number = 14): number[] {
  const map = new Map<string, number>();
  for (const [date, qty] of daily) map.set(date, Number(qty) || 0);
  const endDate = endIso ? new Date(endIso + "T00:00:00Z") : new Date();
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate.getTime() - i * 86400_000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    out.push(map.get(key) || 0);
  }
  return out;
}

function humanRelativeFR(isoDate: string): string {
  const today = new Date();
  const uae = new Date(today.getTime() + (today.getTimezoneOffset() + 240) * 60000);
  const dayMs = 86400_000;
  const target = new Date(isoDate + "T00:00:00Z");
  const days = Math.floor((uae.getTime() - target.getTime()) / dayMs);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1j";
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return months === 1 ? "il y a 1 mois" : `il y a ${months} mois`;
}

function daysSince(isoDate: string): number {
  const now = new Date();
  const uae = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  const target = new Date(isoDate + "T00:00:00Z");
  return Math.max(0, Math.floor((uae.getTime() - target.getTime()) / 86400_000));
}

/**
 * 7-day sliding window delta.
 * Compares avg(last 7 days) vs avg(previous 7 days).
 * Noise filter: max(last7, prev7) must be >= MIN_VOLUME u/j.
 * Returns { delta_pct, last7, prev7 } or null if below noise floor.
 */
const MIN_VOLUME = 2.0; // u/j — below this, % swings are noise
function compute7dSliding(
  daily: [string, number][],
  dbEndIso: string,
): { delta: number; last7: number; prev7: number } | null {
  if (!daily || daily.length === 0) return null;
  const map = new Map(daily);
  const end = new Date(dbEndIso + "T00:00:00Z");
  let sumLast = 0;
  let sumPrev = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(end.getTime() - i * 86400_000).toISOString().slice(0, 10);
    sumLast += map.get(d) ?? 0;
  }
  for (let i = 8; i <= 14; i++) {
    const d = new Date(end.getTime() - i * 86400_000).toISOString().slice(0, 10);
    sumPrev += map.get(d) ?? 0;
  }
  const last7 = sumLast / 7;
  const prev7 = sumPrev / 7;
  if (Math.max(last7, prev7) < MIN_VOLUME) return null; // noise
  let delta: number;
  if (prev7 === 0) delta = last7 > 0 ? 500 : 0; // cap new launches at +500%
  else delta = Math.round(((last7 - prev7) / prev7) * 100);
  return { delta, last7, prev7 };
}

function lifecycleGrowthFrom(r: LifecycleResponse): LifecycleItem[] {
  const end = r.db_end;
  const DEAD = new Set(["discontinued", "zombie"]);
  const scored: { p: LifecycleProduct; delta: number }[] = [];
  for (const p of r.products) {
    if (!p.is_active) continue;
    if (DEAD.has(p.phase ?? p.status ?? "")) continue;
    const s = compute7dSliding(p.daily, end);
    if (!s || s.delta <= 0) continue;
    scored.push({ p, delta: s.delta });
  }
  return scored
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map(({ p, delta }) => ({
      name: p.primary,
      delta,
      stage: (p.phase === "new_launch" ? "launch" : "growth") as "launch" | "growth",
      spark: sparkFromDaily(p.daily, end, 14),
    }));
}

function lifecycleDeclineFrom(r: LifecycleResponse): LifecycleItem[] {
  const end = r.db_end;
  const DEAD = new Set(["discontinued", "zombie"]);
  const scored: { p: LifecycleProduct; delta: number }[] = [];
  for (const p of r.products) {
    if (!p.is_active) continue;
    if (DEAD.has(p.phase ?? p.status ?? "")) continue;
    const s = compute7dSliding(p.daily, end);
    if (!s || s.delta >= 0) continue;
    scored.push({ p, delta: s.delta });
  }
  return scored
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5)
    .map(({ p, delta }) => ({
      name: p.primary,
      delta,
      stage: "decline" as const,
      last_sale: humanRelativeFR(p.last_sale),
      spark: sparkFromDaily(p.daily, end, 14),
    }));
}

// ---- Dashboard /api/top_customers ----
interface TopCustomersResponse {
  date: string;
  customers: { name?: string; initials: string; amt: number; visits: number; tag: "VIP" | "HOT" | "NEW" }[];
}

async function fetchTopCustomers(date: string): Promise<TopCustomersResponse | null> {
  try {
    return await fetchJson<TopCustomersResponse>(`${DASHBOARD}/api/top_customers?date=${date}&limit=5`);
  } catch (e) {
    console.warn("[top_customers] fetch failed", e);
    return null;
  }
}

function topVipsFrom(r: TopCustomersResponse): TopVip[] {
  return (r.customers || []).map((c) => ({
    initials: c.initials,
    name: c.name,
    amt: Math.round(c.amt),
    visits: c.visits,
    tag: c.tag,
  }));
}

// ---- Coach /slack/recent ----
interface SlackMessage {
  agent: AgentCode;
  channel: string;
  text: string;
  ts: string;
}

interface SlackRecentResponse {
  messages: SlackMessage[];
}

async function fetchSlackRecent(): Promise<SlackRecentResponse | null> {
  try {
    return await fetchJson<SlackRecentResponse>(`${COACH}/slack/recent?limit=40&hours=168`);
  } catch (e) {
    console.warn("[slack_recent] fetch failed", e);
    return null;
  }
}

function severityFromText(text: string): Severity {
  const lower = text.toLowerCase();
  if (/alerte|warning|error|⚠|fail|ko|down|risk|churn/.test(lower)) return "warn";
  if (/ok|ready|done|deploy|publié|✅|success/.test(lower)) return "good";
  return "info";
}

function firstLine(text: string): string {
  const trimmed = (text || "").split("\n")[0].trim();
  return trimmed
    .replace(/<[@#][A-Z0-9]+\|?([^>]*)>/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/:[a-z_+-]+:/g, "")
    .replace(/[_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function signalRadarFromSlack(r: SlackRecentResponse): SignalItem[] {
  const items = r.messages
    .map((m) => ({
      agent: m.agent,
      text: firstLine(m.text),
      sev: severityFromText(m.text),
    }))
    .filter((s) => s.text.length > 0);
  return dedupeByText(items).slice(0, 6);
}

function dedupeByText<T extends { text: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = x.text.toLowerCase().trim();
    if (k.length === 0 || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function agentBriefingsFromSlack(r: SlackRecentResponse): AgentBriefing[] {
  return dedupeByText(
    r.messages.map((m) => ({ agent: m.agent, text: firstLine(m.text) })).filter((b) => b.text.length > 0),
  ).slice(0, 14);
}

function tickerFromSlack(r: SlackRecentResponse): TickerItem[] {
  return dedupeByText(
    r.messages.map((m) => ({ agent: m.agent, text: firstLine(m.text) })).filter((t) => t.text.length > 0),
  ).slice(0, 18);
}

// ---- Al-Jada Watch /api/scores + /api/events + /api/briefing ----
interface AlJadaScoreRaw {
  day_score: number;
  traffic_score: number;
  context_score: number;
  social_score: number;
  press_score: number;
  competition_score: number;
  day_label_fr: string;
  brief_fr: string;
}

async function fetchAlJada(): Promise<AlJadaScore | null> {
  try {
    type BriefingPayload = { weather?: { temp_c?: number; condition_fr?: string } };
    const [scoresRes, eventsRes, briefingRes] = await Promise.all([
      fetchJson<{ scores: AlJadaScoreRaw[] }>(`${ALJADA}/api/scores`),
      fetchJson<{ count: number }>(`${ALJADA}/api/events`).catch(() => ({ count: 0 })),
      fetchJson<BriefingPayload>(`${ALJADA}/api/briefing`).catch(() => ({} as BriefingPayload)),
    ]);
    const s = scoresRes.scores?.[0];
    if (!s) return null;
    return {
      day_score_pct: Math.round(s.day_score * 100),
      day_label: s.day_label_fr,
      brief: s.brief_fr,
      traffic_pct: Math.round(s.traffic_score * 100),
      social_pct: Math.round(s.social_score * 100),
      press_pct: Math.round(s.press_score * 100),
      competition_pct: Math.round(s.competition_score * 100),
      event_count: eventsRes.count || 0,
      temp_c: briefingRes.weather?.temp_c,
      condition: briefingRes.weather?.condition_fr,
    };
  } catch (e) {
    console.warn("[aljada] fetch failed", e);
    return null;
  }
}

// ---- Coach /api/learning/accuracy + /api/learning/product-accuracy ----
interface AccuracyDay {
  date: string;
  predicted_total: number;
  actual_total: number;
  mae_total: number;
}
interface ProductAccuracy {
  product: string;
  avg_predicted: number;
  avg_actual: number;
  mae: number;
  bias: number;
  n_days: number;
}

async function fetchIaAccuracy(): Promise<IaAccuracy | null> {
  try {
    const [accRes, prodRes] = await Promise.all([
      fetchJson<{ days: number; daily: AccuracyDay[] }>(`${COACH}/api/learning/accuracy`),
      fetchJson<{ products: ProductAccuracy[] }>(`${COACH}/api/learning/product-accuracy`),
    ]);
    const daily = accRes.daily || [];
    const n = daily.length || 1;
    const mae_total_avg = Math.round(daily.reduce((s, d) => s + d.mae_total, 0) / n);
    const predicted_total_avg = Math.round(daily.reduce((s, d) => s + d.predicted_total, 0) / n);
    const actual_total_avg = Math.round(daily.reduce((s, d) => s + d.actual_total, 0) / n);
    const topProducts = (prodRes.products || [])
      .filter((p) => p.n_days >= 5)
      .sort((a, b) => b.mae - a.mae)
      .slice(0, 5)
      .map((p) => ({
        product: p.product,
        mae: Math.round(p.mae * 10) / 10,
        bias: Math.round(p.bias * 10) / 10,
        n_days: p.n_days,
      }));
    return {
      days: accRes.days || 30,
      mae_total_avg,
      predicted_total_avg,
      actual_total_avg,
      top_products: topProducts,
    };
  } catch (e) {
    console.warn("[ia_accuracy] fetch failed", e);
    return null;
  }
}

// ---- Aggregator ----
// Each adapter runs in its own try/catch so one failure never poisons the rest.
export async function buildLiveSnapshot(): Promise<Snapshot> {
  const date = todayUAE();
  const ydayDate = new Date(new Date(date + "T00:00:00Z").getTime() - 86400_000)
    .toISOString()
    .slice(0, 10);
  const [daily, cronStatus, forecast, batch, batchYday, lifecycle, topCustomers, slackRecent, aljada, iaAccuracy] =
    await Promise.all([
      fetchDaily(date),
      fetchCronStatus(),
      fetchForecast(),
      fetchBatch(date),
      fetchBatch(ydayDate),
      fetchLifecycle(),
      fetchTopCustomers(date),
      fetchSlackRecent(),
      fetchAlJada(),
      fetchIaAccuracy(),
    ]);

  const snap: Snapshot = { ...SNAPSHOT_MOCK };

  try {
    if (daily) {
      const liveKpis = kpisFromDaily(daily);
      snap.kpis = {
        ...snap.kpis,
        ...liveKpis,
        waste_pct: snap.kpis.waste_pct,
        agents_live: snap.kpis.agents_live,
      } as KpiSnapshot;
      // Daily CA target = 2 500 AED. Fixed, non-negotiable (until Karim says otherwise).
      const target = 2500;
      const now = new Date();
      const uae = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
      const nowHour = uae.getHours() + uae.getMinutes() / 60;

      // Build hero shape from REAL hourly revenue + mock shape as forecast beyond now.
      const startHour = 6;
      const endHour = 20;
      const hourRev = daily.kpis.hour_revenue || {};
      let cumul = 0;
      const actuals: [number, number][] = [[startHour, 0]];
      for (let h = startHour; h <= Math.ceil(nowHour); h++) {
        cumul += Number(hourRev[String(h)] || 0);
        actuals.push([h, Math.min(1, cumul / target)]);
      }
      // Ensure we land the last actual point at current_ca / target
      const actualFracNow = daily.kpis.revenue / target;
      actuals.push([nowHour, Math.min(1, actualFracNow)]);

      // Forecast: scale mock shape after nowHour so it extends from current point toward 1.0 by endHour
      const mockShape = SNAPSHOT_MOCK.hero.shape;
      const mockAtNow = mockShape.find((p) => p[0] >= nowHour)?.[1] ?? actualFracNow;
      const remainingFrac = 1 - actualFracNow;
      const mockRemaining = 1 - mockAtNow;
      const forecastScale = mockRemaining > 0 ? remainingFrac / mockRemaining : 1;
      const forecast: [number, number][] = mockShape
        .filter((p) => p[0] > nowHour)
        .map(([h, v]) => [h, Math.min(1, actualFracNow + (v - mockAtNow) * forecastScale)]);
      if (!forecast.some((p) => p[0] === endHour)) forecast.push([endHour, 1]);

      snap.hero = {
        ...snap.hero,
        now_hour: nowHour,
        start_hour: startHour,
        end_hour: endHour,
        current_ca: Math.round(daily.kpis.revenue),
        target,
        shape: [...actuals, ...forecast],
        hour_revenue: hourRev,
      };

      // Day split from morning/afternoon revenue
      // Si l'après-midi/soir ne sont pas encore démarrés aujourd'hui, on tombe
      // back sur la veille complète pour éviter l'effet "figé 100/0" en matinée.
      const morning = daily.kpis.morning_revenue ?? 0;
      const afternoon = daily.kpis.afternoon_revenue ?? 0;
      const evening = daily.kpis.evening_revenue ?? 0;
      const dayTotal = morning + afternoon + evening;
      if (dayTotal > 0 && afternoon + evening > 0) {
        snap.day_split_pct = Math.round((morning / dayTotal) * 100);
      } else {
        // Fetch yesterday's daily for a meaningful split
        try {
          const ydayDaily = await fetchDaily(ydayDate);
          if (ydayDaily) {
            const ym = ydayDaily.kpis.morning_revenue ?? 0;
            const ya = ydayDaily.kpis.afternoon_revenue ?? 0;
            const ye = ydayDaily.kpis.evening_revenue ?? 0;
            const yt = ym + ya + ye;
            if (yt > 0) snap.day_split_pct = Math.round((ym / yt) * 100);
          }
        } catch {}
      }
      snap.channel_mix = channelMixFromDaily(daily);
      const liveSectors = sectorsFromDaily(daily);
      if (liveSectors.length > 0) snap.sector_yield = liveSectors;

      // Performance Globale — 3 real signals + Agents IA uptime (computed in component)
      // Source batch = aujourd'hui si rempli, sinon veille (batch = clôture J-1 le matin J)
      const activeBatch =
        batch?.products && batch.products.length > 0 ? batch : batchYday;
      let cuisine = 0;
      let stocks = 0;
      if (activeBatch?.products && activeBatch.products.length > 0) {
        const ps = activeBatch.products;
        const avgSt =
          ps.reduce((s, p) => s + (p.sell_through_pct ?? 0), 0) / ps.length;
        cuisine = Math.round(Math.max(0, Math.min(100, avgSt)));
        const wasteRate =
          activeBatch.summary?.waste_rate_pct ??
          (() => {
            const tb = ps.reduce((s, p) => s + (p.batch_qty ?? 0), 0);
            const tw = ps.reduce((s, p) => s + (p.waste_qty ?? 0), 0);
            return tb > 0 ? (tw / tb) * 100 : 0;
          })();
        stocks = Math.round(Math.max(0, Math.min(100, 100 - wasteRate)));
      }
      // Clients = CA today / target 2500 AED (capped)
      const rev = daily.kpis.revenue ?? 0;
      const clients = Math.round(Math.max(0, Math.min(100, (rev / 2500) * 100)));
      snap.perf_scores = { cuisine, clients, stocks };
    }
  } catch (e) {
    console.warn("[adapter:daily]", e);
  }

  try {
    if (lifecycle) {
      // Always overwrite — even empty — so mock fallback never bleeds through
      snap.lifecycle_growth = lifecycleGrowthFrom(lifecycle);
      snap.lifecycle_decline = lifecycleDeclineFrom(lifecycle);
      // Catalogue breakdown by status
      const byStatus: Record<string, number> = {};
      let zombies = 0;
      let silentLong = 0;
      for (const p of lifecycle.products) {
        const s = (p.status || "unknown").toLowerCase();
        byStatus[s] = (byStatus[s] || 0) + 1;
        if (s === "zombie") zombies++;
        if ((p.days_silent ?? 0) > 30) silentLong++;
      }
      snap.lifecycle_breakdown = {
        total: lifecycle.products.length,
        by_status: byStatus,
        zombie_count: zombies,
        silent_long: silentLong,
      };
    }
  } catch (e) {
    console.warn("[adapter:lifecycle]", e);
  }

  try {
    if (cronStatus) {
      const live = cronQueueFromStatus(cronStatus);
      if (live.length > 0) snap.cron_queue = live;
      snap.supervisor = supervisorFromStatus(cronStatus, snap.supervisor);
      const liveBriefings = briefingsFromStatus(cronStatus);
      if (liveBriefings.length > 0) snap.agent_briefings = liveBriefings;
      const hayhayCrons = Object.values(cronStatus.status).filter(
        (x) => !(x.channel || "").toLowerCase().startsWith("bdouin-") && !/imak/i.test(x.label),
      );
      const total = hayhayCrons.length;
      const ok = hayhayCrons.filter((x) => x.compliant).length;
      const pct = total > 0 ? (ok / total) * 100 : 99.4;
      snap.kpis.agents_live = {
        value: ok,
        total,
        uptime_pct: Math.round(pct * 10) / 10,
      };
    }
  } catch (e) {
    console.warn("[adapter:cron]", e);
  }

  try {
    if (forecast) {
      snap.context = contextFromForecast(
        forecast,
        cronStatus ? Object.keys(cronStatus.status).length : 0,
      );
    }
  } catch (e) {
    console.warn("[adapter:forecast]", e);
  }

  try {
    if (daily) {
      const live = marketTapeFromLive(daily, batch);
      if (live.length > 0) snap.market_tape = live;
    }
  } catch (e) {
    console.warn("[adapter:market_tape]", e);
  }

  try {
    if (topCustomers && topCustomers.customers?.length > 0) {
      snap.top_vips = topVipsFrom(topCustomers);
    }
  } catch (e) {
    console.warn("[adapter:top_customers]", e);
  }

  try {
    if (slackRecent && slackRecent.messages?.length > 0) {
      const sig = signalRadarFromSlack(slackRecent);
      if (sig.length > 0) snap.signal_radar = sig;
      const brf = agentBriefingsFromSlack(slackRecent);
      if (brf.length > 0) snap.agent_briefings = brf;
      const tk = tickerFromSlack(slackRecent);
      if (tk.length > 0) snap.ticker = tk;
    }
  } catch (e) {
    console.warn("[adapter:slack_recent]", e);
  }

  if (aljada) snap.aljada = aljada;
  if (iaAccuracy) snap.ia_accuracy = iaAccuracy;

  return snap;
}
