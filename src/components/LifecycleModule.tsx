import { useEffect, useMemo, useState } from "react";
import { DASHBOARD, fetchJson } from "../api/client";

// Native product lifecycle view, fed by dashboard /api/lifecycle (90-day matrix).
// Client lifecycle (RFM / churn / 6-stage funnel) lives in the coach #hayhay-client-bot
// but is not exposed as an API yet → that half is a documented placeholder below.

interface LifecycleProduct {
  canonical: string;
  category: string;
  status: string; // active | recovering(*phase) | declining | zombie | discontinued | seasonal
  phase: string;
  trend: string; // ++ | + | = | · | − | −−
  total_qty: number;
  total_revenue: number;
  aov: number;
  last_sale: string | null;
  days_silent: number;
  is_seasonal: boolean;
  weekend_only: boolean;
}
interface LifecycleResponse {
  generated_at: string;
  db_end: string;
  lookback_days: number;
  products: LifecycleProduct[];
}

// Status drives the headline badge + breakdown; phase refines it in the table.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Actif", cls: "lc-green" },
  recovering: { label: "Reprise", cls: "lc-blue" },
  declining: { label: "Déclin", cls: "lc-yellow" },
  zombie: { label: "Zombie", cls: "lc-amber" },
  discontinued: { label: "Arrêté", cls: "lc-grey" },
  seasonal: { label: "Saisonnier", cls: "lc-purple" },
};
const statusMeta = (s: string) => STATUS_META[s] || { label: s || "—", cls: "lc-grey" };

function trendColor(t: string): string {
  if (t === "++" || t === "+") return "var(--mint-dk)";
  if (t === "−" || t === "−−") return "var(--pink-dk)";
  return "var(--ink-soft, #8a8f98)";
}

const fmt = (n: number) => n.toLocaleString("fr-FR");
const STATUS_ORDER = ["active", "recovering", "declining", "zombie", "seasonal", "discontinued"];

export function LifecycleModule() {
  const [data, setData] = useState<LifecycleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchJson<LifecycleResponse>(`${DASHBOARD}/api/lifecycle`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const view = useMemo(() => {
    const P = data?.products ?? [];
    // `phase` is the richer dimension (active/recovering/declining/zombie/
    // discontinued/seasonal); `status` collapses recovering+declining into active.
    const counts: Record<string, number> = {};
    for (const p of P) counts[p.phase] = (counts[p.phase] || 0) + 1;

    // Momentum lists exclude anything not sold in the last 7 days (hard rule:
    // a dead product with a big delta pollutes the actionable list).
    const recent = P.filter((p) => p.days_silent <= 7);
    const growth = recent
      .filter((p) => p.trend === "++" || p.trend === "+")
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 8);
    const decline = recent
      .filter((p) => p.trend === "−" || p.trend === "−−")
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 8);

    const sorted = [...P].sort((a, b) => {
      const sa = STATUS_ORDER.indexOf(a.phase);
      const sb = STATUS_ORDER.indexOf(b.phase);
      if (sa !== sb) return (sa < 0 ? 99 : sa) - (sb < 0 ? 99 : sb);
      return b.total_revenue - a.total_revenue;
    });
    const rows = filter ? sorted.filter((p) => p.phase === filter) : sorted;

    return { counts, growth, decline, rows, total: P.length };
  }, [data, filter]);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">🔄 Cycle de vie</h1>
          <div className="mod-sub">
            Produits sur {data?.lookback_days ?? 90}j · matrice au {data?.db_end ?? "…"} · momentum filtré 7j
          </div>
        </div>
      </div>

      {error ? (
        <div className="mod-card"><div className="recon-error">Erreur: {error}</div></div>
      ) : !data ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="stock-kpis">
            <div className="stock-kpi"><div className="stock-kpi-lab">Catalogue</div><div className="stock-kpi-val">{view.total}</div><div className="stock-kpi-sub">produits vus 90j</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Actifs</div><div className="stock-kpi-val" style={{ color: "var(--mint-dk)" }}>{view.counts.active || 0}</div><div className="stock-kpi-sub">vendus régulièrement</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Reprise</div><div className="stock-kpi-val" style={{ color: "#3E7AC0" }}>{view.counts.recovering || 0}</div><div className="stock-kpi-sub">tendance ↑</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">En déclin</div><div className="stock-kpi-val" style={{ color: "var(--yellow-dk)" }}>{view.counts.declining || 0}</div><div className="stock-kpi-sub">tendance ↓</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">🧟 Zombies</div><div className="stock-kpi-val" style={{ color: "#C2792B" }}>{view.counts.zombie || 0}</div><div className="stock-kpi-sub">à réveiller / couper</div></div>
          </div>

          {/* Status filter pills */}
          <div className="lc-pills">
            <button className={`lc-pill ${!filter ? "lc-pill-on" : ""}`} onClick={() => setFilter(null)}>Tous ({view.total})</button>
            {STATUS_ORDER.filter((s) => view.counts[s]).map((s) => (
              <button key={s} className={`lc-pill ${statusMeta(s).cls} ${filter === s ? "lc-pill-on" : ""}`} onClick={() => setFilter(filter === s ? null : s)}>
                {statusMeta(s).label} ({view.counts[s]})
              </button>
            ))}
          </div>

          {/* Momentum: growth + decline (7-day rule applied) */}
          <div className="lc-momentum">
            <div className="mod-card">
              <div className="lc-mom-head" style={{ color: "var(--mint-dk)" }}>▲ En croissance</div>
              {view.growth.length === 0 ? <div className="muted lc-empty">Aucun produit en croissance récente</div> : view.growth.map((p, i) => (
                <div className="lc-mom-row" key={i}>
                  <span className="strong">{p.canonical}</span>
                  <span className="lc-mom-meta">{fmt(p.total_qty)} u · {fmt(Math.round(p.total_revenue))} AED <b style={{ color: trendColor(p.trend) }}>{p.trend}</b></span>
                </div>
              ))}
            </div>
            <div className="mod-card">
              <div className="lc-mom-head" style={{ color: "var(--pink-dk)" }}>▼ En déclin</div>
              {view.decline.length === 0 ? <div className="muted lc-empty">Aucun produit en déclin récent</div> : view.decline.map((p, i) => (
                <div className="lc-mom-row" key={i}>
                  <span className="strong">{p.canonical}</span>
                  <span className="lc-mom-meta">{fmt(Math.round(p.total_revenue))} AED <b style={{ color: trendColor(p.trend) }}>{p.trend}</b></span>
                </div>
              ))}
            </div>
          </div>

          {/* Full catalogue table */}
          <div className="mod-card">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Produit</th><th>Catégorie</th><th>Statut</th>
                  <th className="num">Qté 90j</th><th className="num">CA 90j</th>
                  <th>Tendance</th><th>Dernière vente</th><th className="num">Silence</th>
                </tr>
              </thead>
              <tbody>
                {view.rows.map((p, i) => {
                  const m = statusMeta(p.phase);
                  return (
                    <tr key={i}>
                      <td className="strong">{p.canonical}{p.is_seasonal ? " 🗓️" : ""}{p.weekend_only ? " 🅆" : ""}</td>
                      <td className="muted">{p.category}</td>
                      <td><span className={`lc-badge ${m.cls}`}>{m.label}</span></td>
                      <td className="num">{fmt(p.total_qty)}</td>
                      <td className="num">{fmt(Math.round(p.total_revenue))}</td>
                      <td><b style={{ color: trendColor(p.trend) }}>{p.trend}</b></td>
                      <td className="muted">{p.last_sale || "—"}</td>
                      <td className="num" style={{ color: p.days_silent > 60 ? "var(--ink-soft, #8a8f98)" : p.days_silent > 7 ? "var(--yellow-dk)" : "inherit" }}>
                        {p.days_silent >= 9999 ? "—" : `${p.days_silent}j`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clients — pending coach endpoint */}
          <div className="mod-card lc-clients-soon">
            <div className="lc-mom-head">👥 Cycle de vie clients</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              RFM, rétention, churn et tunnel 6 stages — en attente d'un endpoint coach
              (<code>GET /api/clients/lifecycle</code>). Données déjà calculées par le bot
              <b> #hayhay-client-bot</b>, à exposer côté coach pour brancher cette section.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
