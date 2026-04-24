export type AgentCode =
  | "FOO" | "CLI" | "PRD" | "MKT" | "BKR" | "SOP" | "SUP" | "CTX" | "SVR";

export type Severity = "good" | "warn" | "info";

export interface SignalItem {
  agent: AgentCode;
  text: string;
  sev: Severity;
}

export interface AgentBriefing {
  agent: AgentCode;
  text: string;
}

export interface TickerItem {
  agent: AgentCode;
  text: string;
}

export interface MarketTapeRow {
  product: string;
  range_low: number;
  range_high: number;
  actual: number;
  delta: number;
}

export interface TopVip {
  initials: string;
  name?: string;
  amt: number;
  visits: number;
  tag: "VIP" | "HOT" | "NEW";
}

export interface VipAtRisk {
  initials: string;
  name: string;
  lifetime: number;
  visits_45d: number;
  amt_45d: number;
  last_visit: string; // ISO date
  days_silent: number;
}

export interface ChannelMix {
  POS: number;
  Talabat: number;
  Shop: number;
  Keeta: number;
}

export interface SectorYieldRow {
  name: string;
  ca: number;
  tx: number;
}

export interface LifecycleItem {
  name: string;
  delta: number;
  stage: "growth" | "launch" | "decline";
  spark: number[];
  last_sale?: string;
}

export interface ContextTag {
  k: string;
  on: boolean;
}

export interface ContextSnapshot {
  density: number;
  n_signals: number;
  tags: ContextTag[];
}

export interface CronQueueItem {
  at: string;
  label: string;
  kind: "CRON" | "SUPER";
}

export interface SupervisorSnapshot {
  uptime_session_s: number;
  api_calls: number;
  slack_posts: number;
}

export interface HeroSnapshot {
  now_hour: number;
  start_hour: number;
  end_hour: number;
  target: number;
  current_ca: number;
  shape: [number, number][];
  /** Real AED sold per hour, keyed by hour string ("6"…"23"). Drives the actual-only histogram. */
  hour_revenue?: Record<string, number>;
}

export interface KpiSnapshot {
  ca_today: { value: number; currency: "AED"; target: number; pct: number; delta_vs_yesterday_pct: number };
  orders: { value: number; delta_vs_yesterday: number };
  avg_ticket: { value: number; currency: "AED" };
  waste_pct: { value: number; ceiling: number };
  agents_live: { value: number; total: number; uptime_pct: number };
}

export interface LifecycleBreakdown {
  total: number;
  by_status: Record<string, number>;
  zombie_count: number;
  silent_long: number;
}

export interface AlJadaScore {
  day_score_pct: number;
  day_label: string;
  brief: string;
  traffic_pct: number;
  social_pct: number;
  press_pct: number;
  competition_pct: number;
  event_count: number;
  temp_c?: number;
  condition?: string;
}

export interface IaAccuracy {
  days: number;
  mae_total_avg: number;
  predicted_total_avg: number;
  actual_total_avg: number;
  top_products: { product: string; mae: number; bias: number; n_days: number }[];
}

export interface Snapshot {
  clock_uae_offset_min: number;
  kpis: KpiSnapshot;
  lifecycle_breakdown?: LifecycleBreakdown;
  hero: HeroSnapshot;
  signal_radar: SignalItem[];
  signal_pool: SignalItem[];
  agent_briefings: AgentBriefing[];
  market_tape: MarketTapeRow[];
  top_vips: TopVip[];
  vips_at_risk?: VipAtRisk[];
  channel_mix: ChannelMix;
  sector_yield: SectorYieldRow[];
  lifecycle_growth: LifecycleItem[];
  lifecycle_decline: LifecycleItem[];
  context: ContextSnapshot;
  cron_queue: CronQueueItem[];
  supervisor: SupervisorSnapshot;
  ticker: TickerItem[];
  day_split_pct?: number;
  aljada?: AlJadaScore;
  ia_accuracy?: IaAccuracy;
  perf_scores?: {
    cuisine: number;   // avg sell_through_pct du batch (0-100)
    clients: number;   // CA today / target (0-100, capped)
    stocks: number;    // 100 - waste_rate (0-100)
  };
}

export interface StreamEvent {
  type: "signal";
  payload: SignalItem & { ts: number };
}
