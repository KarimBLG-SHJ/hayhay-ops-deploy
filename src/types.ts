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
  amt: number;
  visits: number;
  tag: "VIP" | "HOT" | "NEW";
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
}

export interface KpiSnapshot {
  ca_today: { value: number; currency: "AED"; target: number; pct: number; delta_vs_yesterday_pct: number };
  orders: { value: number; delta_vs_yesterday: number };
  avg_ticket: { value: number; currency: "AED" };
  waste_pct: { value: number; ceiling: number };
  agents_live: { value: number; total: number; uptime_pct: number };
}

export interface Snapshot {
  clock_uae_offset_min: number;
  kpis: KpiSnapshot;
  hero: HeroSnapshot;
  signal_radar: SignalItem[];
  signal_pool: SignalItem[];
  agent_briefings: AgentBriefing[];
  market_tape: MarketTapeRow[];
  top_vips: TopVip[];
  channel_mix: ChannelMix;
  sector_yield: SectorYieldRow[];
  lifecycle_growth: LifecycleItem[];
  lifecycle_decline: LifecycleItem[];
  context: ContextSnapshot;
  cron_queue: CronQueueItem[];
  supervisor: SupervisorSnapshot;
  ticker: TickerItem[];
  day_split_pct?: number;
}

export interface StreamEvent {
  type: "signal";
  payload: SignalItem & { ts: number };
}
