import type { TickerItem, AgentCode } from "../types";

const COLORS: Record<AgentCode, string> = {
  FOO: "var(--green)",
  CLI: "var(--cyan)",
  PRD: "var(--amber)",
  MKT: "#ffb545",
  BKR: "var(--gold)",
  SOP: "var(--dim)",
  SUP: "var(--cyan)",
  CTX: "var(--amber)",
  SVR: "var(--green)",
};

export function Ticker({ items }: { items: TickerItem[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {doubled.map((it, i) => (
          <span key={i} className="ticker-item">
            <b style={{ color: COLORS[it.agent] || "var(--text)", letterSpacing: "0.08em" }}>{it.agent}</b>
            <span>{it.text}</span>
            <span className="sep">│</span>
          </span>
        ))}
      </div>
    </div>
  );
}
