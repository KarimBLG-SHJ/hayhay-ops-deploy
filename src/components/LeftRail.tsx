import { useCallback, useEffect, useRef, useState } from "react";
import { CountNumber, TileHead, goto } from "./primitives";
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
}

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
      <TileHead title="SIGNAL RADAR · 9 AGENTS" live />
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
              onClick={() => goto(`/dashboard/signals/${it.agent}/${it.id}`)}
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
  const [flash, setFlash] = useState<Record<number, "up" | "down">>({});
  useEffect(() => setRows(initial), [initial]);
  useEffect(() => {
    const i = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r, idx) => {
          if (Math.random() < 0.35) {
            const add = Math.round((Math.random() - 0.45) * 6);
            const newActual = Math.max(0, r.actual + add);
            const mid = (r.range_low + r.range_high) / 2;
            const newDelta = Math.round(newActual - mid);
            if ((r.delta >= 0) !== (newDelta >= 0)) {
              setFlash((f) => ({ ...f, [idx]: newDelta >= 0 ? "up" : "down" }));
              window.setTimeout(() => {
                setFlash((f) => {
                  const n = { ...f };
                  delete n[idx];
                  return n;
                });
              }, 160);
            }
            return { ...r, actual: newActual, delta: newDelta };
          }
          return r;
        }),
      );
    }, 1800);
    return () => window.clearInterval(i);
  }, []);

  return (
    <div className="tile">
      <TileHead title="PRODUITS · LIVE" />
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
          <span>RANGE → RÉEL</span>
          <span style={{ textAlign: "right" }}>Δ</span>
        </div>
        {rows.map((r, idx) => (
          <div
            key={idx}
            className={"tape-row clickable" + (flash[idx] ? " flash-" + flash[idx] : "")}
            onClick={() => goto(`/dashboard/product/${encodeURIComponent(r.product)}`)}
          >
            <span className="tape-name">{r.product}</span>
            <span className="tape-range">
              {r.range_low}-{r.range_high} → <span style={{ color: "var(--text)" }}>{r.actual}</span>
            </span>
            <span className={"tape-delta " + (r.delta >= 0 ? "up" : "down")}>
              {r.delta >= 0 ? "+" : ""}
              {r.delta}
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
    <div className="tile clickable" onClick={() => goto("/dashboard/supervisor")}>
      <TileHead title="SUPERVISOR" />
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
  const [items, setItems] = useState<BriefingRow[]>(() =>
    initial.map((it, i) => ({ id: Date.now() - i * 60000, ts: Date.now() - i * 12000, ...it })),
  );
  useEffect(() => {
    setItems(initial.map((it, i) => ({ id: Date.now() - i * 60000, ts: Date.now() - i * 12000, ...it })));
  }, [initial]);
  useEffect(() => {
    const i = window.setInterval(() => {
      if (initial.length === 0) return;
      const pick = initial[Math.floor(Math.random() * initial.length)];
      setItems((prev) => [{ id: Date.now(), ts: Date.now(), ...pick }, ...prev].slice(0, 16));
    }, 5200);
    return () => window.clearInterval(i);
  }, [initial]);

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
  const now = Date.now();
  return (
    <div
      className="tile"
      style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0 }}
    >
      <TileHead title="AGENT BRIEFINGS" live />
      <div className="news-list" style={{ flex: "1 1 auto", minHeight: 0, maxHeight: "none" }}>
        {items.map((it) => {
          const aged = (now - it.ts) / 1000 > 600;
          return (
            <div
              key={it.id}
              className={"news-item clickable " + (kindClass[it.agent] || "NEW") + (aged ? " aged" : "")}
              onClick={() => goto(`/dashboard/agent/${it.agent}`)}
            >
              <span className="ntag">{it.agent}:</span> {it.text}
            </div>
          );
        })}
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
