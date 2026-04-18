import { useEffect, useState, type ReactNode } from "react";
import { CountNumber, LiveDot, goto } from "./primitives";
import type { KpiSnapshot } from "../types";

function FlipDigit({ value }: { value: string }) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const [prev, setPrev] = useState(value);
  useEffect(() => {
    if (value !== displayed) {
      setPrev(displayed);
      setFlipping(true);
      const t = window.setTimeout(() => {
        setDisplayed(value);
        setFlipping(false);
      }, 350);
      return () => window.clearTimeout(t);
    }
  }, [value, displayed]);
  return (
    <span className={"flip-digit" + (flipping ? " flip" : "")}>
      <span className="d out">{flipping ? prev : displayed}</span>
      {flipping && <span className="d in">{value}</span>}
    </span>
  );
}

function Horloge() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const uae = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  const hh = uae.getHours();
  const h = hh % 12 || 12;
  const m = uae.getMinutes();
  const s = uae.getSeconds();
  const ampm = hh >= 12 ? "PM" : "AM";
  const str = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const digits = str.split("");
  return (
    <div className="horloge">
      <div className="horloge-time">
        {digits.map((d, i) =>
          d === ":" ? (
            <span key={i} style={{ padding: "0 2px", color: "var(--dim)" }}>
              :
            </span>
          ) : (
            <FlipDigit key={i} value={d} />
          ),
        )}
        <span style={{ fontSize: 12, color: "var(--dim)", marginLeft: 6, alignSelf: "flex-end", marginBottom: 2 }}>
          {ampm}
        </span>
      </div>
      <span className="horloge-live">
        <LiveDot /> SHARJAH · LIVE
      </span>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  onClick?: () => void;
}

function Kpi({ label, value, sub, accent, onClick }: KpiProps) {
  return (
    <div className={"kpi" + (onClick ? " clickable" : "")} onClick={onClick}>
      <div className="kpi-label">{label}</div>
      <div className={"kpi-value" + (accent ? "" : " num")}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

interface TopBarProps {
  kpis: KpiSnapshot;
}

export function TopBar({ kpis }: TopBarProps) {
  const pct = Math.round((kpis.ca_today.value / kpis.ca_today.target) * 100);
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-title">HAYHAY OPS</div>
        <div className="brand-sub">// 9 AGENTS · SHARJAH UAE</div>
      </div>
      <div className="kpi-row">
        <Kpi
          onClick={() => goto("/dashboard/revenue")}
          label="CA DU JOUR"
          value={<CountNumber value={kpis.ca_today.value} format={(v) => Math.round(v).toLocaleString("en-US")} />}
          sub={`AED · ${pct}% TARGET`}
          accent
        />
        <Kpi
          onClick={() => goto("/dashboard/orders")}
          label="COMMANDES"
          value={<CountNumber value={kpis.orders.value} format={(v) => Math.round(v).toString()} />}
          sub={`+${kpis.orders.delta_vs_yesterday} VS J-1`}
          accent
        />
        <Kpi
          onClick={() => goto("/dashboard/basket")}
          label="TICKET MOY."
          value={<CountNumber value={kpis.avg_ticket.value} format={(v) => v.toFixed(1)} />}
          sub="AED"
        />
        <Kpi
          onClick={() => goto("/dashboard/waste")}
          label="WASTE"
          value={<CountNumber value={kpis.waste_pct.value} format={(v) => v.toFixed(1) + "%"} />}
          sub={`CEIL ${kpis.waste_pct.ceiling}%`}
        />
        <Kpi
          onClick={() => goto("/dashboard/supervisor")}
          label="AGENTS"
          value={
            <span>
              <CountNumber value={kpis.agents_live.value} format={(v) => String(Math.round(v))} />/
              {kpis.agents_live.total}
            </span>
          }
          sub={`${kpis.agents_live.uptime_pct}% UPTIME`}
        />
      </div>
      <Horloge />
    </div>
  );
}
