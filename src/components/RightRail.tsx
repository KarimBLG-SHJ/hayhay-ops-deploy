import { useEffect, useState, type ReactNode } from "react";
import { CountNumber, LINKS, TileHead, clamp, openUrl } from "./primitives";
import type {
  ChannelMix,
  ContextSnapshot,
  CronQueueItem,
  LifecycleItem,
  SectorYieldRow,
  Snapshot,
  TopVip,
} from "../types";

function FlowBias({ morningPct }: { morningPct: number }) {
  const afternoonPct = 100 - morningPct;
  return (
    <div className="tile">
      <TileHead title="DAY SPLIT" sub="Part du CA du jour · matin (06→14h) vs après-m (14→22h)" />
      <div className="flowbias-wrap">
        <div className="flowbias-top">
          <span className="flowbias-num up">
            <CountNumber value={morningPct} format={(v) => Math.round(v) + "%"} />
          </span>
          <span className="flowbias-num down" style={{ color: "var(--mute)" }}>
            {Math.round(afternoonPct)}%
          </span>
        </div>
        <div className="flowbias-split">
          <div className="up" style={{ width: `${morningPct}%` }} />
          <div className="down" style={{ width: `${afternoonPct}%` }} />
        </div>
        <div className="flowbias-chips">
          <div className="flowbias-chip green">MATIN · 06→14</div>
          <div className="flowbias-chip amber">APRÈS-M · 14→22</div>
        </div>
      </div>
    </div>
  );
}

function WhaleWatch({ vips: initial }: { vips: TopVip[] }) {
  const [rows, setRows] = useState<TopVip[]>(initial);
  useEffect(() => setRows(initial), [initial]);
  return (
    <div className="tile">
      <TileHead
        title="TOP VIP · JOUR"
        sub="Top 5 clients en boutique/retrait aujourd'hui · AED = dépensé ce jour · N× = visites lifetime"
        meta={`${rows.length} CLIENTS`}
      />
      <div className="whale-list">
        {rows.map((w, i) => (
          <div
            key={i}
            className="whale-row clickable"
            title={`${w.name || w.initials} — ouvrir dans Foodics`}
            onClick={() => openUrl(LINKS.foodicsConsole)}
          >
            <span className="whale-addr">{w.name || w.initials}</span>
            <span className="whale-amt">
              <CountNumber value={w.amt} format={(v) => String(Math.round(v))} /> AED
            </span>
            <span className="whale-tag">
              <b>{w.visits}×</b> {w.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelMixTile({ mix }: { mix: ChannelMix }) {
  const size = 160;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const entries = [
    { label: "POS", pct: Math.round(mix.POS * 100), color: "#e8c547" },
    { label: "TALABAT", pct: Math.round(mix.Talabat * 100), color: "#4dd9e6" },
    { label: "SHOP", pct: Math.round(mix.Shop * 100), color: "#7ee787" },
    { label: "KEETA", pct: Math.round(mix.Keeta * 100), color: "#ffb545" },
  ];
  const total = entries.reduce((s, v) => s + v.pct, 0) || 1;
  let offset = -Math.PI / 2;
  const arcs = entries.map((v, i) => {
    const frac = v.pct / total;
    const seg = frac * circ;
    const dashArr = `${seg} ${circ - seg}`;
    const el = (
      <circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={v.color}
        strokeWidth={stroke}
        strokeDasharray={dashArr}
        strokeDashoffset={-((offset + Math.PI / 2) / (2 * Math.PI)) * circ}
        style={{ transition: "stroke-dasharray 0.8s var(--ease)" }}
      />
    );
    offset += frac * Math.PI * 2;
    return el;
  });
  return (
    <div className="tile">
      <TileHead title="CHANNEL MIX" sub="Répartition du CA du jour · POS = en boutique · Talabat/Shop/Keeta = livraison" />
      <div className="strat-wrap">
        <div className="donut">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={stroke}
            />
            {arcs}
          </svg>
          <div className="donut-center">
            <div className="lab">POS</div>
            <div className="val">{entries[0].pct}%</div>
          </div>
        </div>
        <div className="strat-legend">
          {entries.map((v, i) => (
            <div key={i} className="li">
              <span className="sw" style={{ background: v.color }} />
              {v.label} · {v.pct}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 56;
  const h = 18;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const rng = max - min || 1;
  const pts = values
    .map((v, i) => {
      const xx = (i / (values.length - 1)) * w;
      const yy = h - ((v - min) / rng) * h;
      return `${xx.toFixed(1)},${yy.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        points={pts}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VelocityBar({ value, max, color }: { value: number; max: number; color: string }) {
  const N = 8;
  const filled = Math.round((value / max) * N);
  return (
    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, letterSpacing: "0.5px", color }}>
      {"█".repeat(filled)}
      <span style={{ color: "var(--border-2)" }}>{"░".repeat(N - filled)}</span>
    </span>
  );
}

export function LifecycleGrowth({ items }: { items: LifecycleItem[] }) {
  const maxDelta = Math.max(...items.map((it) => it.delta));
  return (
    <div className="tile clickable" title="Ouvrir la lifecycle complète (JSON)" onClick={() => openUrl(LINKS.hayhayDashboard + "/api/lifecycle")}>
      <TileHead
        title={
          <>
            <span style={{ color: "#00FF88" }}>▲</span> TOP 5 · EN CROISSANCE
          </>
        }
        sub="Produits actifs avec le plus fort Δ ventes · 30j récents vs 30j précédents"
        meta="14j"
      />
      <div className="lc-list">
        {items.map((it, i) => (
          <div
            key={i}
            className="lc-row clickable"
            title={it.name}
            onClick={(e) => {
              e.stopPropagation();
              openUrl(LINKS.hayhayDashboard);
            }}
          >
            <span className="lc-name">{it.name}</span>
            <span className="lc-meta">
              <span className="lc-delta" style={{ color: "#00FF88" }}>+{it.delta}%</span>
              <span className="lc-vel">
                <VelocityBar value={it.delta} max={maxDelta} color="#00FF88" />
              </span>
              <span className="lc-stage" style={{ color: "#00FF88" }}>{it.stage}</span>
            </span>
            <span className="lc-spark">
              <Sparkline values={it.spark} color="#00FF88" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LifecycleDecline({ items }: { items: LifecycleItem[] }) {
  return (
    <div className="tile clickable" title="Ouvrir la lifecycle complète (JSON)" onClick={() => openUrl(LINKS.hayhayDashboard + "/api/lifecycle")}>
      <TileHead
        title={
          <>
            <span style={{ color: "#F59E0B" }}>▼</span> TOP 5 · EN DÉCLIN
          </>
        }
        sub="Produits actifs en plus forte baisse · 30j récents vs 30j précédents"
        meta="30j · actifs"
      />
      <div className="lc-list">
        {items.map((it, i) => (
          <div
            key={i}
            className="lc-row clickable"
            title={it.name}
            onClick={(e) => {
              e.stopPropagation();
              openUrl(LINKS.hayhayDashboard);
            }}
          >
            <span className="lc-name">{it.name}</span>
            <span className="lc-meta">
              <span className="lc-delta" style={{ color: "#F59E0B" }}>{it.delta}%</span>
              <span className="lc-extra">{it.last_sale}</span>
              <span className="lc-stage" style={{ color: "#F59E0B" }}>{it.stage}</span>
            </span>
            <span className="lc-spark">
              <Sparkline values={it.spark} color="#F59E0B" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorYield({ rows: initial }: { rows: SectorYieldRow[] }) {
  const [rows, setRows] = useState<SectorYieldRow[]>(initial);
  useEffect(() => setRows(initial), [initial]);
  return (
    <div className="tile">
      <TileHead
        title="CA PAR CATÉGORIE"
        sub="CA du jour par catégorie Foodics · tx = nb d'items vendus"
        meta={`${rows.length} CAT.`}
      />
      <div className="sector-list">
        {rows.map((r, i) => (
          <div
            key={i}
            className="sector-row clickable"
            title="Ouvrir HayHay Dashboard"
            onClick={() => openUrl(LINKS.hayhayDashboard)}
          >
            <span className="sector-name">{r.name}</span>
            <span className="sector-amt">
              <CountNumber value={r.ca} format={(v) => Math.round(v).toLocaleString()} /> AED
            </span>
            <span className="sector-trades">
              <CountNumber value={r.tx} format={(v) => String(Math.round(v))} /> tx
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextScore({ context }: { context: ContextSnapshot }) {
  const [wobble, setWobble] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setWobble((Math.random() - 0.5) * 2), 180);
    return () => window.clearInterval(i);
  }, []);
  const displayPct = clamp(context.density + wobble, 0, 100);
  return (
    <div className="tile clickable" title="Ouvrir ContextOS dashboard" onClick={() => openUrl(LINKS.contextOsDashboard)}>
      <TileHead
        title="CONTEXT SCORE"
        sub="Densité 0-100 des drivers externes du jour · météo, événements, ramadan, cycle paye"
        meta="CONTEXTOS"
      />
      <div className="gauge-wrap">
        <div className="gauge-top">
          <span className="events">DENSITÉ</span>
          <span className="num">
            <CountNumber value={displayPct} format={(v) => v.toFixed(1)} />/100
          </span>
          <span className="events">{context.n_signals} SIG</span>
        </div>
        <div className="gauge-bar">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="gauge-tick"
              style={{
                height: `${20 + ((i * 73) % 80)}%`,
                opacity: i / 60 < displayPct / 100 ? 0.85 : 0.15,
              }}
            />
          ))}
          <div className="gauge-needle" style={{ left: `${displayPct}%` }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {context.tags.map((c, i) => (
            <span
              key={i}
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid " + (c.on ? "rgba(232,197,71,0.35)" : "var(--border)"),
                color: c.on ? "var(--gold)" : "var(--mute)",
                letterSpacing: "0.08em",
              }}
            >
              {c.k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CronQueue({ queue }: { queue: CronQueueItem[] }) {
  const sideClass: Record<string, string> = { CRON: "BUY", SUPER: "SELL" };
  return (
    <div className="tile">
      <TileHead title="QUEUE · CRONS & DEADLINES" sub="Jobs planifiés aujourd'hui · horaire UAE · source coach /cron/status" />
      <div className="expiry-list">
        {queue.map((r, i) => (
          <div
            key={i}
            className="expiry-row clickable"
            title="Ouvrir cron status JSON"
            onClick={() => openUrl(LINKS.coachStatus)}
          >
            <span className="expiry-name">{r.label}</span>
            <span className="expiry-time">{r.at}</span>
            <span className={"expiry-side " + (sideClass[r.kind] || "BUY")}>{r.kind}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RightRail({ snap, journal }: { snap: Snapshot; journal: ReactNode }) {
  const morningPct = snap.day_split_pct ?? 58;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflow: "auto" }}>
      <FlowBias morningPct={morningPct} />
      <WhaleWatch vips={snap.top_vips} />
      <ChannelMixTile mix={snap.channel_mix} />
      {journal}
      <SectorYield rows={snap.sector_yield} />
      <ContextScore context={snap.context} />
      <CronQueue queue={snap.cron_queue} />
    </div>
  );
}
