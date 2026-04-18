import { useEffect, useMemo, useRef, useState } from "react";
import { CountNumber, LINKS, TileHead, clamp, openUrl } from "./primitives";
import { useFocusMode } from "./Arcade";
import { LifecycleGrowth, LifecycleDecline } from "./RightRail";
import type { AgentBriefing, HeroSnapshot, Snapshot } from "../types";

function shapeValueAt(shape: [number, number][], hour: number): number {
  if (hour <= shape[0][0]) return shape[0][1];
  for (let i = 1; i < shape.length; i++) {
    if (hour <= shape[i][0]) {
      const [h0, v0] = shape[i - 1];
      const [h1, v1] = shape[i];
      const t = (hour - h0) / (h1 - h0 || 1);
      return v0 + (v1 - v0) * t;
    }
  }
  return shape[shape.length - 1][1];
}

function HeroChart({ hero }: { hero: HeroSnapshot }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 300 });
  // NOW tracks live UAE wall-clock time. Updates once per minute so the marker inches
  // forward smoothly without racing the 60s snapshot poll. No artificial advance.
  const computeNowHour = () => {
    const d = new Date();
    const uae = new Date(d.getTime() + (d.getTimezoneOffset() + 240) * 60000);
    return Math.min(hero.end_hour, Math.max(hero.start_hour, uae.getHours() + uae.getMinutes() / 60));
  };
  const [nowHour, setNowHour] = useState(computeNowHour);
  const drawnRef = useRef(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => setNowHour(computeNowHour());
    tick();
    const i = window.setInterval(tick, 60_000);
    return () => window.clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero.end_hour, hero.start_hour]);

  const { w, h } = dims;
  const pad = { l: 48, r: 14, t: 20, b: 22 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const x = (hour: number) =>
    pad.l + ((hour - hero.start_hour) / (hero.end_hour - hero.start_hour)) * iw;
  const y = (val: number) => pad.t + (1 - val / hero.target) * ih;

  const samples = useMemo(() => {
    const arr: { hr: number; v: number }[] = [];
    for (let hr = hero.start_hour; hr <= hero.end_hour; hr += 0.1) {
      arr.push({ hr, v: shapeValueAt(hero.shape, hr) * hero.target });
    }
    return arr;
  }, [hero]);

  const actualPts = samples.filter((s) => s.hr <= nowHour);
  const forecastPts = samples.filter((s) => s.hr >= nowHour);

  const linePath = useMemo(() => {
    if (actualPts.length < 2) return "";
    let d = `M ${x(actualPts[0].hr)},${y(actualPts[0].v)}`;
    for (let i = 1; i < actualPts.length; i++) {
      const p = actualPts[i];
      d += ` L ${x(p.hr)},${y(p.v)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualPts, w, h]);

  const forecastPath = useMemo(() => {
    if (forecastPts.length < 2) return "";
    let d = `M ${x(forecastPts[0].hr)},${y(forecastPts[0].v)}`;
    for (let i = 1; i < forecastPts.length; i++) {
      const p = forecastPts[i];
      d += ` L ${x(p.hr)},${y(p.v)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecastPts, w, h]);

  useEffect(() => {
    if (drawnRef.current || !pathRef.current) return;
    drawnRef.current = true;
    const p = pathRef.current;
    try {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
      p.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)";
      requestAnimationFrame(() => {
        p.style.strokeDashoffset = "0";
      });
      window.setTimeout(() => {
        p.style.transition = "none";
        p.style.strokeDasharray = "none";
      }, 2400);
    } catch {
      /* empty */
    }
  }, [linePath]);

  // Y-axis ticks scale with target so the grid always makes sense.
  const yTickCount = 5;
  const yStep = Math.max(100, Math.ceil(hero.target / yTickCount / 100) * 100);
  const yTicks: number[] = [];
  for (let v = 0; v <= hero.target; v += yStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== hero.target) yTicks.push(hero.target);
  const yLabels = yTicks.map((v, i) => (
    <g key={"y" + i}>
      <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(126,231,135,0.06)" strokeWidth="1" />
      <text
        x={pad.l - 8}
        y={y(v) + 3}
        fill="rgba(122,133,144,0.7)"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="end"
      >
        {v >= 1000 ? v / 1000 + "k" : v}
      </text>
    </g>
  ));

  const targetY = y(hero.target);
  const hourTicks = [6, 8, 10, 12, 14, 16, 18, 20];
  const hourLabels = hourTicks.map((hh, i) => (
    <g key={"h" + i}>
      <line x1={x(hh)} x2={x(hh)} y1={pad.t} y2={h - pad.b} stroke="rgba(126,231,135,0.04)" strokeWidth="1" />
      <text
        x={x(hh)}
        y={h - 4}
        fill="rgba(122,133,144,0.7)"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="middle"
      >
        {String(hh).padStart(2, "0")}:00
      </text>
    </g>
  ));

  const nowVal = shapeValueAt(hero.shape, nowHour) * hero.target;
  const nowX = x(nowHour);
  const nowY = y(nowVal);

  const areaPath =
    actualPts.length >= 2 ? `${linePath} L ${nowX},${h - pad.b} L ${x(actualPts[0].hr)},${h - pad.b} Z` : "";

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9cf1a3" />
          <stop offset="100%" stopColor="#5cc968" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(126,231,135,0.28)" />
          <stop offset="100%" stopColor="rgba(126,231,135,0)" />
        </linearGradient>
        <radialGradient id="glowDot" r="0.5">
          <stop offset="0%" stopColor="rgba(180,255,190,1)" />
          <stop offset="100%" stopColor="rgba(126,231,135,0)" />
        </radialGradient>
      </defs>
      {yLabels}
      {hourLabels}
      <line
        x1={pad.l}
        x2={w - pad.r}
        y1={targetY}
        y2={targetY}
        stroke="#e8c547"
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.5"
      />
      <text
        x={w - pad.r - 4}
        y={targetY - 6}
        fill="#e8c547"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="end"
        letterSpacing="0.1em"
      >
        TARGET {(hero.target / 1000).toFixed(1)}k
      </text>
      <path d={areaPath} fill="url(#areaGrad)" opacity="0.8" />
      <path
        d={forecastPath}
        fill="none"
        stroke="#e8c547"
        strokeWidth="1.4"
        strokeDasharray="5 6"
        opacity="0.5"
      />
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={nowX}
        x2={nowX}
        y1={pad.t}
        y2={h - pad.b}
        stroke="rgba(126,231,135,0.2)"
        strokeWidth="1"
        strokeDasharray="1 3"
      />
      <circle cx={nowX} cy={nowY} r="14" fill="url(#glowDot)" opacity="0.9">
        <animate attributeName="r" values="10;18;10" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={nowX} cy={nowY} r="3.5" fill="#eaffea" />
      <text
        x={nowX + 8}
        y={nowY - 10}
        fill="#9cf1a3"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.1em"
      >
        NOW {String(Math.floor(nowHour)).padStart(2, "0")}:
        {String(Math.floor((nowHour % 1) * 60)).padStart(2, "0")}
      </text>
      <text
        x={nowX + 8}
        y={nowY + 4}
        fill="var(--text)"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {Math.round(nowVal).toLocaleString()} AED
      </text>
    </svg>
  );
}

/**
 * ORDRES / H — one bar per hour from 06→20h, height = real AED sold that hour.
 * Only actuals (past hours). Future hours render as a tiny stub so the grid stays.
 * No forecast extrapolation so the shape is always honest.
 */
function Histogram({ hourRevenue, nowHour }: { hourRevenue: Record<string, number>; nowHour: number }) {
  const bars = useMemo(() => {
    const hours: { hr: number; v: number; past: boolean }[] = [];
    for (let h = 6; h <= 20; h++) {
      const v = Number(hourRevenue[String(h)] || 0);
      hours.push({ hr: h, v, past: h <= nowHour });
    }
    const maxV = Math.max(...hours.map((x) => x.v), 1);
    return hours.map((x) => ({ ...x, norm: x.v / maxV }));
  }, [hourRevenue, nowHour]);

  return (
    <div className="hist-block">
      <div className="hist-wrap" aria-hidden>
        {bars.map((b, i) => (
          <span
            key={i}
            className="hist-bar"
            style={{
              height: b.past ? `${5 + b.norm * 95}%` : "6%",
              opacity: b.past ? 0.4 + b.norm * 0.6 : 0.18,
              animation: "none",
            }}
            title={`${String(b.hr).padStart(2, "0")}:00 — ${Math.round(b.v)} AED`}
          />
        ))}
      </div>
      <div className="hist-axis" aria-hidden>
        {bars.map((b, i) => (
          <span key={i} className="hist-tick">
            {b.hr % 2 === 0 ? String(b.hr).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowStrip({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flow-strip">
      <div className="flow-pct">
        <span>
          <CountNumber value={pct} format={(v) => Math.round(v) + "%"} />
        </span>
        <small>{label}</small>
      </div>
      <div className="flow-bar">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EventLog({ pool }: { pool: AgentBriefing[] }) {
  // Deterministic rendering of whatever briefings are in the snapshot.
  // No synthetic rows — what you see here is exactly what Slack + cron reported.
  const verbForAgent = (a: string): string => {
    if (a === "FOO" || a === "BKR") return "EXEC";
    if (a === "CLI" || a === "CTX") return "SWAP";
    if (a === "SUP" || a === "PRD") return "XFER";
    return "EXEC";
  };
  return (
    <div className="exec-wrap" style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div className="exec-head">
        <span className="exec-title">JOURNAL D'ÉVÉNEMENTS</span>
        <span className="exec-title" style={{ color: "var(--gold)" }}>
          · {pool.length} récents
        </span>
      </div>
      <div className="exec-body" style={{ flex: "1 1 auto", overflowY: "auto" }}>
        {pool.map((it, idx) => {
          const tid = String(idx + 1).padStart(4, "0");
          const verb = verbForAgent(it.agent);
          const cells = ["ENTRY", `${it.agent} · ${it.text.slice(0, 48)}`, "EXEC", `#${tid}`, verb, "→ Slack"];
          return (
            <div key={idx} className="exec-row">
              {cells.map((c, i) =>
                i % 2 === 0 ? (
                  <span key={i} className={"exec-tag " + c}>
                    {c}
                  </span>
                ) : (
                  <span key={i} className="exec-val">
                    {c}
                  </span>
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero({ snap }: { snap: Snapshot }) {
  const [focused, setFocused] = useFocusMode();
  const [repeat, setRepeat] = useState(62);
  const [oph, setOph] = useState(54);
  const [prep, setPrep] = useState(42);
  const [conv, setConv] = useState(1.82);

  useEffect(() => {
    const i = window.setInterval(() => {
      setRepeat((v) => clamp(v + (Math.random() - 0.5) * 2, 48, 78));
      setOph((v) => clamp(v + Math.round((Math.random() - 0.5) * 4), 30, 110));
      setPrep((v) => clamp(v + Math.round((Math.random() - 0.5) * 3), 25, 90));
      setConv((v) => clamp(v + (Math.random() - 0.5) * 0.08, 0.8, 3.2));
    }, 1200);
    return () => window.clearInterval(i);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12, alignContent: "stretch", height: "100%" }}>
      <div
        className={"tile hero clickable" + (focused ? " focused-hero" : "")}
        title="Ouvrir HayHay Dashboard"
        onClick={() => !focused && openUrl(LINKS.hayhayDashboard)}
      >
        <button
          className="focus-btn"
          onClick={(e) => {
            e.stopPropagation();
            setFocused((f) => !f);
          }}
        >
          {focused ? "← EXIT · ESC" : "⛶ FOCUS"}
        </button>
        <TileHead title="HAYHAY PULSE · LIVE SESSION · SHARJAH" sub="CA cumulé du jour 06→20h · courbe verte = réel · pointillés = forecast" live />
        <div className="hero-head" style={{ padding: "16px 16px 0" }}>
          <div
            className="hero-pnl"
            style={{ color: "var(--green)", textShadow: "0 0 24px rgba(126,231,135,0.25)" }}
          >
            <CountNumber value={snap.kpis.ca_today.value} format={(v) => Math.round(v).toLocaleString("en-US")} />
            <span style={{ fontSize: 22, color: "var(--dim)", letterSpacing: "0.15em", marginLeft: 10 }}>AED</span>
          </div>
          <div className="hero-meta">
            <div>CUMULATIF · 06:00 → 20:00</div>
            <div style={{ color: "var(--gold)", marginTop: 2 }}>
              TARGET {snap.hero.target.toLocaleString()} AED
            </div>
          </div>
        </div>
        <div className="hero-chart-wrap">
          <HeroChart hero={snap.hero} />
        </div>
        <div style={{ padding: "0 10px" }}>
          <Histogram
            hourRevenue={snap.hero.hour_revenue || {}}
            nowHour={(() => {
              const d = new Date();
              const uae = new Date(d.getTime() + (d.getTimezoneOffset() + 240) * 60000);
              return uae.getHours() + uae.getMinutes() / 60;
            })()}
          />
        </div>
        <div style={{ padding: "0 10px" }}>
          <FlowStrip pct={repeat} label="CLIENTS RÉCURRENTS / TOTAL" />
        </div>
        <div style={{ padding: "0 10px 10px" }}>
          <div className="hero-kpis">
            <div className="hk">
              <div className="v green">
                <CountNumber value={oph} format={(v) => String(Math.round(v))} />
              </div>
              <div className="l">ORDRES / H</div>
            </div>
            <div className="hk">
              <div className="v">
                <CountNumber value={prep} format={(v) => String(Math.round(v))} />s
              </div>
              <div className="l">PREP MOYEN</div>
            </div>
            <div className="hk">
              <div className="v">
                <CountNumber value={conv} format={(v) => v.toFixed(2)} />
              </div>
              <div className="l">INSTORE / ONLINE</div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="hero-lifecycle"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minHeight: 0 }}
      >
        <LifecycleGrowth items={snap.lifecycle_growth} />
        <LifecycleDecline items={snap.lifecycle_decline} />
      </div>
    </div>
  );
}
