import type { Snapshot } from "../types";

/**
 * Ventes — first native Phase 2 module.
 * Pure presentation: consumes only data already present in the snapshot
 * (the Cockpit fetches it), so no new network calls and no new failure modes.
 */

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function aed(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} AED`;
}

function deltaTag(pct: number) {
  const up = pct >= 0;
  return (
    <span className="mod-delta" style={{ color: up ? "var(--mint-dk)" : "var(--pink-dk)" }}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(pct))}%
    </span>
  );
}

function Bars({ data, color }: { data: { label: string; value: number; hi?: boolean }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mod-bars">
      {data.map((d, i) => (
        <div className="mod-bar-col" key={i}>
          <div className="mod-bar-track">
            <div
              className="mod-bar-fill"
              style={{ height: `${(d.value / max) * 100}%`, background: d.hi ? "var(--text)" : color }}
            />
          </div>
          <div className="mod-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SalesModule({ snap }: { snap: Snapshot }) {
  const { kpis, hero, channel_mix, sector_yield, lifecycle_growth, lifecycle_decline, market_tape } = snap;

  const ca = kpis.ca_today;
  const week = kpis.ca_week;

  // Daily CA target = 2500 AED (hard rule); mirror KpisRow rather than the
  // adapter's ca_today.target/pct fields, which are stale.
  const CA_TARGET = 2500;
  const targetPct = Math.round(((ca?.value ?? 0) / CA_TARGET) * 100);
  const ordersDelta = kpis.orders?.delta_vs_yesterday ?? 0;

  const weekDays = (week?.days ?? []).map((d) => {
    const dt = new Date(d.date + "T00:00:00");
    return { label: DAYS_FR[dt.getDay()], value: d.ca };
  });

  const hourRev = hero.hour_revenue ?? {};
  const hourBars = Object.keys(hourRev)
    .map((h) => ({ h: Number(h), value: hourRev[h] }))
    .sort((a, b) => a.h - b.h)
    .map((x) => ({ label: `${x.h}h`, value: x.value, hi: x.h === hero.now_hour }));

  const mix = [
    { k: "POS", pct: Math.round((channel_mix.POS ?? 0) * 100), color: "var(--mint)" },
    { k: "Talabat", pct: Math.round((channel_mix.Talabat ?? 0) * 100), color: "var(--pink)" },
    { k: "Shop", pct: Math.round((channel_mix.Shop ?? 0) * 100), color: "var(--yellow)" },
    { k: "Keeta", pct: Math.round((channel_mix.Keeta ?? 0) * 100), color: "var(--purple)" },
  ].filter((s) => s.pct > 0);

  const cats = (sector_yield ?? []).slice(0, 8);
  const catMax = Math.max(1, ...cats.map((c) => c.ca));

  const movers = (market_tape ?? []).slice(0, 6);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">📈 Ventes</h1>
          <div className="mod-sub">Synthèse du jour · données live</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mod-kpi-grid">
        <div className="mod-kpi">
          <div className="mod-kpi-label">CA du jour</div>
          <div className="mod-kpi-val">{aed(ca?.value ?? 0)}</div>
          <div className="mod-kpi-foot">
            {targetPct}% du target · {deltaTag(ca?.delta_vs_yesterday_pct ?? 0)} vs hier
          </div>
        </div>
        <div className="mod-kpi">
          <div className="mod-kpi-label">Commandes</div>
          <div className="mod-kpi-val">{kpis.orders?.value ?? 0}</div>
          <div className="mod-kpi-foot">
            <span className="mod-delta" style={{ color: ordersDelta >= 0 ? "var(--mint-dk)" : "var(--pink-dk)" }}>
              {ordersDelta >= 0 ? "▲" : "▼"} {Math.abs(ordersDelta)}
            </span>{" "}
            vs hier
          </div>
        </div>
        <div className="mod-kpi">
          <div className="mod-kpi-label">Ticket moyen</div>
          <div className="mod-kpi-val">{aed(kpis.avg_ticket?.value ?? 0)}</div>
          <div className="mod-kpi-foot">par commande</div>
        </div>
        <div className="mod-kpi">
          <div className="mod-kpi-label">CA semaine</div>
          <div className="mod-kpi-val">{aed(week?.total ?? 0)}</div>
          <div className="mod-kpi-foot">{aed(week?.avg_daily ?? 0)} / jour</div>
        </div>
      </div>

      <div className="mod-row">
        {/* CA 7 jours */}
        <div className="mod-card">
          <div className="mod-card-title">CA · 7 derniers jours</div>
          {weekDays.length ? <Bars data={weekDays} color="var(--mint)" /> : <div className="mod-empty">Pas de données semaine</div>}
        </div>

        {/* Mix canal */}
        <div className="mod-card mod-card-narrow">
          <div className="mod-card-title">Mix par canal</div>
          {mix.length ? (
            <div className="mod-mix">
              {mix.map((s) => (
                <div className="mod-mix-row" key={s.k}>
                  <span className="mod-mix-dot" style={{ background: s.color }} />
                  <span className="mod-mix-name">{s.k}</span>
                  <span className="mod-mix-bar">
                    <span className="mod-mix-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                  </span>
                  <span className="mod-mix-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mod-empty">Pas de données canal</div>
          )}
        </div>
      </div>

      {/* Répartition horaire */}
      {hourBars.length > 0 && (
        <div className="mod-card">
          <div className="mod-card-title">Répartition horaire (CA / heure)</div>
          <Bars data={hourBars} color="var(--sky)" />
        </div>
      )}

      <div className="mod-row">
        {/* CA par catégorie */}
        <div className="mod-card">
          <div className="mod-card-title">CA par catégorie</div>
          {cats.length ? (
            <div className="mod-cats">
              {cats.map((c) => (
                <div className="mod-cat-row" key={c.name}>
                  <span className="mod-cat-name" title={c.name}>{c.name}</span>
                  <span className="mod-cat-bar">
                    <span className="mod-cat-bar-fill" style={{ width: `${(c.ca / catMax) * 100}%` }} />
                  </span>
                  <span className="mod-cat-ca">{aed(c.ca)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mod-empty">Pas de données catégorie</div>
          )}
        </div>

        {/* Produits qui bougent */}
        <div className="mod-card">
          <div className="mod-card-title">Produits qui bougent</div>
          {movers.length ? (
            <table className="mod-table">
              <tbody>
                {movers.map((m) => (
                  <tr key={m.product}>
                    <td className="mod-td-name" title={m.product}>{m.product}</td>
                    <td className="mod-td-num">{Math.round(m.actual)}</td>
                    <td className="mod-td-delta" style={{ color: m.delta >= 0 ? "var(--mint-dk)" : "var(--pink-dk)" }}>
                      {m.delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(m.delta))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mod-empty">Pas de mouvements</div>
          )}
        </div>
      </div>

      {/* Top croissance / déclin */}
      <div className="mod-row">
        <div className="mod-card">
          <div className="mod-card-title" style={{ color: "var(--mint-dk)" }}>Top croissance</div>
          <ProductDeltaList items={lifecycle_growth} positive />
        </div>
        <div className="mod-card">
          <div className="mod-card-title" style={{ color: "var(--pink-dk)" }}>Top déclin</div>
          <ProductDeltaList items={lifecycle_decline} />
        </div>
      </div>
    </main>
  );
}

function ProductDeltaList({ items, positive }: { items: Snapshot["lifecycle_growth"]; positive?: boolean }) {
  const list = (items ?? []).slice(0, 5);
  if (!list.length) return <div className="mod-empty">—</div>;
  return (
    <div className="mod-lc">
      {list.map((p) => (
        <div className="mod-lc-row" key={p.name}>
          <span className="mod-lc-name" title={p.name}>{p.name}</span>
          <span className="mod-lc-delta" style={{ color: positive ? "var(--mint-dk)" : "var(--pink-dk)" }}>
            {p.delta >= 0 ? "+" : ""}{Math.round(p.delta)}%
          </span>
        </div>
      ))}
    </div>
  );
}
