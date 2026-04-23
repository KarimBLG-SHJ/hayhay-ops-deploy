import type { Snapshot } from "../types";

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="spark-wrap">
      {data.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{ height: `${(v / max) * 100}%`, background: color }}
        />
      ))}
    </div>
  );
}

function makeSpark(seed: number, n = 18, trend = 0): number[] {
  let s = seed;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  let v = 50 + rng() * 20;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    v += (rng() - 0.5 + trend * 0.2) * 8;
    v = Math.max(10, Math.min(100, v));
    out.push(v);
  }
  return out;
}

interface Props { snap: Snapshot }

export function KpisRow({ snap }: Props) {
  const ca = snap.kpis.ca_today;
  const orders = snap.kpis.orders;
  const ticket = snap.kpis.avg_ticket;
  const agents = snap.kpis.agents_live;

  const caTarget = 2500;
  const caPct = Math.round((ca.value / caTarget) * 100);

  return (
    <div className="kpi-strip">
      {/* CA du jour */}
      <div className="kpi-card">
        <div className="kpi-label">CA du jour</div>
        <div className="kpi-value">{ca.value.toLocaleString()}<span style={{ fontSize: 14, color: 'var(--muted)' }}> AED</span></div>
        <Spark data={makeSpark(11, 18, 1)} color="var(--mint)" />
        <div className={`kpi-sub ${caPct >= 100 ? "up" : ""}`}>▲ {caPct}% vs objectif</div>
      </div>

      {/* Commandes */}
      <div className="kpi-card">
        <div className="kpi-label">Commandes</div>
        <div className="kpi-value">{orders.value}</div>
        <Spark data={makeSpark(13, 18, 1)} color="var(--pink-dk)" />
        <div className="kpi-sub up">
          {orders.delta_vs_yesterday >= 0 ? "▲" : "▼"} {Math.abs(orders.delta_vs_yesterday)} vs J−1
        </div>
      </div>

      {/* Ticket moyen */}
      <div className="kpi-card">
        <div className="kpi-label">Ticket moyen</div>
        <div className="kpi-value">{ticket.value.toFixed(1)}<span style={{ fontSize: 14, color: 'var(--muted)' }}> AED</span></div>
        <Spark data={makeSpark(15, 18, 0)} color="var(--purple)" />
        <div className="kpi-sub">Cible 30 AED</div>
      </div>

      {/* Agents actifs */}
      <div className="kpi-card">
        <div className="kpi-label">Agents actifs</div>
        <div className="kpi-value">
          {agents.value}
          <span style={{ fontSize: 14, color: 'var(--muted)' }}> /{agents.total}</span>
        </div>
        <Spark data={makeSpark(19, 18, 0).map((v) => Math.max(30, v * 0.9))} color="var(--text-2)" />
        <div className="kpi-sub">{agents.uptime_pct}% uptime</div>
      </div>

      {/* Promo card */}
      <div className="promo-card">
        <div className="promo-text">
          <div className="promo-title">Soirée chargée ! 🌙</div>
          <div className="promo-sub">Beaucoup de monde attendu entre 18h et 21h</div>
        </div>
        <div className="promo-icon">🥐</div>
      </div>
    </div>
  );
}
