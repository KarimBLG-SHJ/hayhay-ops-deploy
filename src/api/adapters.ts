import type {
  AgentBriefing,
  ChannelMix,
  ContextSnapshot,
  ContextTag,
  CronQueueItem,
  KpiSnapshot,
  MarketTapeRow,
  Snapshot,
  SupervisorSnapshot,
} from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import { COACH, CONTEXTOS, DASHBOARD, fetchJson, todayUAE } from "./client";

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
  };
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
  const items = Object.values(r.status);
  return items.map((it) => ({
    at: parseHourFromLabel(it.label),
    label: it.label.replace(/\s*\([^)]*\)\s*$/, ""),
    kind: "CRON" as const,
  }));
}

function supervisorFromStatus(r: CronStatusResponse, base: SupervisorSnapshot): SupervisorSnapshot {
  const items = Object.values(r.status);
  const ran = items.filter((x) => x.ran_today).length;
  return {
    uptime_session_s: base.uptime_session_s,
    api_calls: base.api_calls,
    slack_posts: ran * 3,
  };
}

function briefingsFromStatus(r: CronStatusResponse): AgentBriefing[] {
  const items = Object.values(r.status);
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
interface BatchResponse {
  date: string;
  batches?: Array<{
    product: string;
    produced: number;
    opening_stock?: number;
    evening_stock?: number;
    foodics_sold?: number;
  }>;
  products?: Array<{
    name: string;
    produced?: number;
    foodics?: number;
    opening?: number;
    evening?: number;
  }>;
}

async function fetchBatch(date: string): Promise<BatchResponse | null> {
  try {
    return await fetchJson<BatchResponse>(`${DASHBOARD}/api/batch?date=${date}`);
  } catch (e) {
    console.warn("[batch] fetch failed", e);
    return null;
  }
}

function marketTapeFromBatch(b: BatchResponse): MarketTapeRow[] {
  // Try both shapes (batches or products)
  const list =
    b.batches?.map((x) => ({
      product: x.product,
      produced: x.produced,
      sold: x.foodics_sold ?? 0,
    })) ||
    b.products?.map((x) => ({
      product: x.name,
      produced: x.produced ?? 0,
      sold: x.foodics ?? 0,
    })) ||
    [];
  return list.slice(0, 8).map((r) => {
    const low = Math.max(0, Math.round(r.produced * 0.85));
    const high = Math.round(r.produced * 1.15);
    const delta = r.sold - Math.round((low + high) / 2);
    return {
      product: r.product,
      range_low: low,
      range_high: high,
      actual: r.sold,
      delta,
    };
  });
}

// ---- Aggregator ----
// Each adapter runs in its own try/catch so one failure never poisons the rest.
export async function buildLiveSnapshot(): Promise<Snapshot> {
  const date = todayUAE();
  const [daily, cronStatus, forecast, batch] = await Promise.all([
    fetchDaily(date),
    fetchCronStatus(),
    fetchForecast(),
    fetchBatch(date),
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
      // Target inferred: 11k AED is Karim's baseline target (per design). Adjust if current_ca implies a higher day.
      const target = Math.max(11000, Math.round((daily.kpis.revenue / 0.4) / 500) * 500);
      const now = new Date();
      const uae = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
      const nowHour = uae.getHours() + uae.getMinutes() / 60;
      // Rescale the mock shape so the value AT now_hour equals current_ca.
      // This keeps the "bakery rush" curve shape but lands the dot at the real revenue.
      const baseShape = SNAPSHOT_MOCK.hero.shape;
      const raw = baseShape.find((p) => p[0] >= nowHour)?.[1] ?? baseShape[0][1];
      const factor = daily.kpis.revenue > 0 && raw > 0 ? daily.kpis.revenue / target / raw : 1;
      const scaledShape = baseShape.map(([h, v]) => [h, Math.min(1, v * factor)] as [number, number]);
      snap.hero = {
        ...snap.hero,
        now_hour: nowHour,
        current_ca: Math.round(daily.kpis.revenue),
        target,
        shape: scaledShape,
      };
      snap.channel_mix = channelMixFromDaily(daily);
    }
  } catch (e) {
    console.warn("[adapter:daily]", e);
  }

  try {
    if (cronStatus) {
      const live = cronQueueFromStatus(cronStatus);
      if (live.length > 0) snap.cron_queue = live;
      snap.supervisor = supervisorFromStatus(cronStatus, snap.supervisor);
      const liveBriefings = briefingsFromStatus(cronStatus);
      if (liveBriefings.length > 0) snap.agent_briefings = liveBriefings;
      const total = Object.values(cronStatus.status).length;
      const ok = Object.values(cronStatus.status).filter((x) => x.compliant).length;
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
    if (batch) {
      const live = marketTapeFromBatch(batch);
      if (live.length > 0) snap.market_tape = live;
    }
  } catch (e) {
    console.warn("[adapter:batch]", e);
  }

  return snap;
}
