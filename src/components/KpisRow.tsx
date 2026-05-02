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
  const caWeek = snap.kpis.ca_week;
  const loading = !!snap.loading;

  const caTarget = 2500;
  const caPct = Math.round((ca.value / caTarget) * 100);

  return (
    <div className="kpi-strip">
      {/* CA du jour */}
      <div className="kpi-card">
        <div className="kpi-label">CA du jour</div>
        {loading ? (
          <div className="kpi-value"><span className="tile-spinner lg" /></div>
        ) : (
          <>
            <div className="kpi-value">{ca.value.toLocaleString()}<span style={{ fontSize: 14, color: 'var(--muted)' }}> AED</span></div>
            <Spark data={makeSpark(11, 18, 1)} color="var(--mint)" />
            <div className={`kpi-sub ${caPct >= 100 ? "up" : ""}`}>▲ {caPct}% vs objectif</div>
          </>
        )}
      </div>

      {/* Commandes */}
      <div className="kpi-card">
        <div className="kpi-label">Commandes</div>
        {loading ? (
          <div className="kpi-value"><span className="tile-spinner lg" /></div>
        ) : (
          <>
            <div className="kpi-value">{orders.value}</div>
            <Spark data={makeSpark(13, 18, 1)} color="var(--pink-dk)" />
            <div className="kpi-sub up">
              {orders.delta_vs_yesterday >= 0 ? "▲" : "▼"} {Math.abs(orders.delta_vs_yesterday)} vs J−1
            </div>
          </>
        )}
      </div>

      {/* Ticket moyen */}
      <div className="kpi-card">
        <div className="kpi-label">Ticket moyen</div>
        {loading ? (
          <div className="kpi-value"><span className="tile-spinner lg" /></div>
        ) : (
          <>
            <div className="kpi-value">{ticket.value.toFixed(1)}<span style={{ fontSize: 14, color: 'var(--muted)' }}> AED</span></div>
            <Spark data={makeSpark(15, 18, 0)} color="var(--purple)" />
            <div className="kpi-sub">Cible 30 AED</div>
          </>
        )}
      </div>

      {/* CA Semaine */}
      <div className="kpi-card">
        <div className="kpi-label">CA Semaine</div>
        {loading ? (
          <div className="kpi-value"><span className="tile-spinner lg" /></div>
        ) : (
          <>
            <div className="kpi-value">
              {caWeek ? Math.round(caWeek.total).toLocaleString() : "—"}
              <span style={{ fontSize: 14, color: 'var(--muted)' }}> AED</span>
            </div>
            <Spark data={caWeek ? caWeek.days.map((d) => d.ca) : makeSpark(19, 7, 0)} color="var(--gold)" />
            <div className="kpi-sub">
              Moy. {caWeek ? Math.round(caWeek.avg_daily).toLocaleString() : "—"} AED/j
            </div>
          </>
        )}
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
