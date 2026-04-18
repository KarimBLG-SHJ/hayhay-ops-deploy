import { useCallback, useEffect, useRef, useState } from "react";
import { CountNumber, LINKS, TileHead, openUrl } from "./primitives";
import { useStream } from "../api/useStream";
import type {
  AgentBriefing,
  AgentCode,
  MarketTapeRow,
  SignalItem,
  Snapshot,
  StreamEvent,
  SupervisorSnapshot,
} from "../types";

const AGENT_COLORS: Record<AgentCode, string> = {
  FOO: "",
  CLI: "cyan",
  PRD: "",
  MKT: "green",
  BKR: "",
  SOP: "cyan",
  SUP: "",
  CTX: "cyan",
  SVR: "green",
};

interface RadarItem extends SignalItem {
  id: number;
  ts: number;
  channel?: string;
}

const AGENT_TO_CHANNEL: Record<AgentCode, string> = {
  FOO: "hayhay-foodics-dashboard",
  SOP: "hayhay-sop-hub",
  SUP: "hayhay-supervision-evaluation",
  CTX: "hayhay-context-dashboard",
  BKR: "hayhay-batch-production-bot",
  PRD: "hayhay-product-bot",
  MKT: "hayhay-marketing-bot",
  CLI: "hayhay-client-bot",
  SVR: "hayhay-supervisor",
};

function SignalRadar({ signals }: { signals: SignalItem[] }) {
  const [items, setItems] = useState<RadarItem[]>(() =>
    signals.map((s, i) => ({ id: Date.now() - i * 60000, ts: Date.now() - i * 62000, ...s })),
  );
  useEffect(() => {
    setItems(signals.map((s, i) => ({ id: Date.now() - i * 60000, ts: Date.now() - i * 62000, ...s })));
  }, [signals]);
  const containerRef = useRef<HTMLDivElement>(null);

  const onEvent = useCallback((evt: StreamEvent) => {
    if (evt.type !== "signal") return;
    setItems((prev) =>
      [{ ...evt.payload, id: evt.payload.ts + Math.random(), ts: Date.now() }, ...prev].slice(0, 6),
    );
    if (containerRef.current && window.burst) {
      const r = containerRef.current.getBoundingClientRect();
      const color = evt.payload.sev === "good" ? "#7ee787" : evt.payload.sev === "warn" ? "#f59e0b" : "#4dd9e6";
      window.burst(r.left + 20, r.top + 30, color, 14);
    }
  }, []);
  useStream(onEvent);

  const now = Date.now();
  const sevClass: Record<string, string> = { good: "green", warn: "red", info: "" };

  return (
    <div ref={containerRef} className="tile" style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
      <TileHead title="SIGNAL RADAR · 9 AGENTS" sub="Dernières alertes Slack · 7 derniers jours" live />
      <div className="radar-list">
        {items.map((it) => {
          const age = (now - it.ts) / 1000;
          const fresh = age < 3;
          const aged = age > 600;
          const ageLabel = age < 60 ? `${Math.floor(age)}s` : `${Math.floor(age / 60)}m`;
          return (
            <div
              key={it.id}
              className={"radar-item clickable" + (fresh ? " fresh" : "") + (aged ? " aged" : "")}
              title={`Ouvrir #${AGENT_TO_CHANNEL[it.agent]} dans Slack`}
              onClick={() => openUrl(LINKS.slackChannel(AGENT_TO_CHANNEL[it.agent] || "coach"))}
            >
              <span className={"sig-tag " + (sevClass[it.sev] || AGENT_COLORS[it.agent] || "")}>{it.agent}</span>
              <span className="sig-msg">{it.text}</span>
              <span className="sig-age">{ageLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketTape({ rows: initial }: { rows: MarketTapeRow[] }) {
  const [rows, setRows] = useState<MarketTapeRow[]>(initial);
  useEffect(() => setRows(initial), [initial]);

  return (
    <div className="tile">
      <TileHead
        title="TOP 10 PRODUITS · LIVE"
        sub="Les 10 + vendus aujourd'hui (Foodics) · batch planifié → vendu à la dernière refresh"
      />
      <div className="tape-list">
        <div
          className="tape-row"
          style={{
            borderBottom: "1px solid var(--border)",
            color: "var(--mute)",
            fontSize: 9,
            letterSpacing: "0.18em",
          }}
        >
          <span>PRODUIT</span>
          <span>PLAN → VENDU</span>
          <span style={{ textAlign: "right" }}>Δ</span>
        </div>
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="tape-row clickable"
            title={`Voir ${r.product} sur HayHay Dashboard`}
            onClick={() => openUrl(LINKS.hayhayDashboard)}
          >
            <span className="tape-name" title={r.product}>{r.product}</span>
            <span className="tape-range">
              {r.range_low > 0 ? `${r.range_low}-${r.range_high}` : "—"} →{" "}
              <span style={{ color: "var(--text)" }}>{r.actual}</span>
            </span>
            <span className={"tape-delta " + (r.delta >= 0 ? "up" : "down")} style={r.range_low === 0 ? { color: "var(--mute)" } : undefined}>
              {r.range_low === 0 ? "—" : (r.delta >= 0 ? "+" : "") + r.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupervisorStats({ initial }: { initial: SupervisorSnapshot }) {
  const [t, setT] = useState(initial.uptime_session_s);
  const [apiCalls, setApiCalls] = useState(initial.api_calls);
  const [slackPosts, setSlackPosts] = useState(initial.slack_posts);
  useEffect(() => {
    const i = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => window.clearInterval(i);
  }, []);
  useEffect(() => {
    const i = window.setInterval(() => {
      setApiCalls((c) => c + Math.floor(Math.random() * 8));
      setSlackPosts((v) => v + (Math.random() > 0.7 ? 1 : 0));
    }, 2800);
    return () => window.clearInterval(i);
  }, []);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const runtime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div className="tile clickable" title="Ouvrir le status coach" onClick={() => openUrl(LINKS.coachStatus)}>
      <TileHead title="SUPERVISOR" sub="Uptime session coach Railway · compteurs cumulés" />
      <div className="metrics-wrap">
        <div className="metric-hero">
          <div className="lab">UPTIME SESSION</div>
          <div className="val">{runtime}</div>
        </div>
        <div className="metric-grid">
          <div className="metric-cell">
            <div className="lab">API CALLS</div>
            <div className="val">
              <CountNumber value={apiCalls} format={(v) => Math.round(v).toLocaleString()} />
            </div>
          </div>
          <div className="metric-cell">
            <div className="lab">SLACK POSTS</div>
            <div className="val">
              <CountNumber value={slackPosts} format={(v) => Math.round(v).toString()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BriefingRow extends AgentBriefing {
  id: number;
  ts: number;
}

function AgentBriefings({ items: initial }: { items: AgentBriefing[] }) {
  const kindClass: Record<AgentCode, string> = {
    FOO: "NEW",
    CLI: "SPREAD",
    PRD: "VOLUME",
    MKT: "ARBI",
    BKR: "NEW",
    SOP: "ARBI",
    SUP: "VOLUME",
    CTX: "SPREAD",
    SVR: "NEW",
  };
  return (
    <div
      className="tile"
      style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0 }}
    >
      <TileHead title="AGENT BRIEFINGS" sub="Derniers posts Slack · 7j · sans doublons" live />
      <div className="news-list" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
        {initial.map((it, idx) => (
          <div
            key={idx}
            className={"news-item clickable " + (kindClass[it.agent] || "NEW")}
            title={`Ouvrir #${AGENT_TO_CHANNEL[it.agent] || "coach"} dans Slack`}
            onClick={() => openUrl(LINKS.slackChannel(AGENT_TO_CHANNEL[it.agent] || "coach"))}
          >
            <span className="ntag">{it.agent}:</span> {it.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeftRail({ snap }: { snap: Snapshot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflow: "auto" }}>
      <SignalRadar signals={snap.signal_radar} />
      <MarketTape rows={snap.market_tape} />
      <SupervisorStats initial={snap.supervisor} />
      <AgentBriefings items={snap.agent_briefings} />
    </div>
  );
}
