import { useEffect, useMemo, useState } from "react";
import { COACH, DASHBOARD, fetchJson } from "../api/client";

// Native product lifecycle view, fed by dashboard /api/lifecycle (90-day matrix).
// Client lifecycle (RFM / churn / 6-stage funnel) is fed by coach
// /api/clients/lifecycle (the #hayhay-client-bot algo exposed as an endpoint).

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

// --- Client lifecycle (coach /api/clients/lifecycle) ---
interface ClientSegment {
  segment: string;
  total: number;
  active: number;
  at_risk: number;
  churned: number;
  avg_ltv: number;
  avg_orders: number;
}
interface ClientFunnelStage {
  stage: string;
  label: string;
  count: number;
  items: { customer: string; priority: number; action: string }[];
}
interface ClientAtRisk {
  name: string;
  segment: string;
  days_absent: number;
  cadence: number | null;
  total_spend: number;
  order_count: number;
}
interface ClientCohort {
  cohort: string;
  size: number;
  age_months: number;
  repeat_rate: number;
  avg_orders: number;
  avg_ltv: number;
  active_30d_pct: number;
}
interface ClientLifecycle {
  generated_at: string;
  db_end: string;
  kpis: {
    total_identified: number;
    active: number;
    at_risk: number;
    churned: number;
    new_30d: number;
    returning_30d: number;
    active_30d: number;
    returning_rate_30d: number;
  };
  segments: ClientSegment[];
  at_risk_urgent: ClientAtRisk[];
  funnel: ClientFunnelStage[];
  cohorts: ClientCohort[];
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
  const [clients, setClients] = useState<ClientLifecycle | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchJson<LifecycleResponse>(`${DASHBOARD}/api/lifecycle`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    fetchJson<ClientLifecycle>(`${COACH}/api/clients/lifecycle`)
      .then((d) => alive && setClients(d))
      .catch((e) => alive && setClientsError(String(e)));
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

          {/* Clients — coach /api/clients/lifecycle */}
          <ClientLifecycleSection data={clients} error={clientsError} />
        </>
      )}
    </main>
  );
}

const SEG_COLOR: Record<string, string> = {
  VIP: "var(--mint-dk)",
  Regular: "#3E7AC0",
  Occasional: "var(--yellow-dk)",
  "One-shot": "var(--ink-soft, #8a8f98)",
};

function ClientLifecycleSection({ data, error }: { data: ClientLifecycle | null; error: string | null }) {
  const maxStage = useMemo(
    () => (data ? Math.max(1, ...data.funnel.map((f) => f.count)) : 1),
    [data],
  );

  return (
    <>
      <div className="mod-head" style={{ marginTop: 28 }}>
        <div>
          <h1 className="mod-title">👥 Cycle de vie clients</h1>
          <div className="mod-sub">
            RFM · churn · tunnel 6 stages · rétention — source #hayhay-client-bot
            {data ? ` · au ${data.db_end}` : ""}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mod-card"><div className="recon-error">Clients indisponible: {error}</div></div>
      ) : !data ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement clients…</span></div></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="stock-kpis">
            <div className="stock-kpi"><div className="stock-kpi-lab">Clients identifiés</div><div className="stock-kpi-val">{fmt(data.kpis.total_identified)}</div><div className="stock-kpi-sub">avec ≥ 1 commande</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Actifs</div><div className="stock-kpi-val" style={{ color: "var(--mint-dk)" }}>{fmt(data.kpis.active)}</div><div className="stock-kpi-sub">dans leur cadence</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">À risque</div><div className="stock-kpi-val" style={{ color: "var(--yellow-dk)" }}>{fmt(data.kpis.at_risk)}</div><div className="stock-kpi-sub">en retard / cadence</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Churned</div><div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{fmt(data.kpis.churned)}</div><div className="stock-kpi-sub">perdus</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Nouveaux 30j</div><div className="stock-kpi-val" style={{ color: "#3E7AC0" }}>{fmt(data.kpis.new_30d)}</div><div className="stock-kpi-sub">vs {fmt(data.kpis.returning_30d)} fidèles ({data.kpis.returning_rate_30d}%)</div></div>
          </div>

          {/* RFM segments + retention funnel */}
          <div className="lc-momentum">
            <div className="mod-card">
              <div className="lc-mom-head">🏆 Segments RFM</div>
              <table className="sheet-table">
                <thead>
                  <tr><th>Segment</th><th className="num">Total</th><th className="num">Actifs</th><th className="num">Risque</th><th className="num">Churn</th><th className="num">LTV moy.</th></tr>
                </thead>
                <tbody>
                  {data.segments.map((s) => (
                    <tr key={s.segment}>
                      <td className="strong"><span style={{ color: SEG_COLOR[s.segment] || "inherit" }}>●</span> {s.segment}</td>
                      <td className="num">{fmt(s.total)}</td>
                      <td className="num" style={{ color: "var(--mint-dk)" }}>{fmt(s.active)}</td>
                      <td className="num" style={{ color: "var(--yellow-dk)" }}>{fmt(s.at_risk)}</td>
                      <td className="num" style={{ color: "var(--pink-dk)" }}>{fmt(s.churned)}</td>
                      <td className="num">{fmt(s.avg_ltv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mod-card">
              <div className="lc-mom-head">🔄 Tunnel rétention (6 stages)</div>
              {data.funnel.map((f) => (
                <div className="lc-mom-row" key={f.stage} style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="strong">{f.label}</span>
                    <span className="lc-mom-meta">{f.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2, #eee)" }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${Math.round((f.count / maxStage) * 100)}%`, background: "var(--mint-dk)", minWidth: f.count ? 4 : 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* At-risk actionable (VIP/Regular) */}
          <div className="mod-card">
            <div className="lc-mom-head" style={{ color: "var(--pink-dk)" }}>🚨 À relancer en priorité (VIP / Regular)</div>
            {data.at_risk_urgent.length === 0 ? (
              <div className="muted lc-empty">Aucun client prioritaire à relancer</div>
            ) : (
              <table className="sheet-table">
                <thead>
                  <tr><th>Client</th><th>Segment</th><th className="num">Absent</th><th className="num">Cadence</th><th className="num">Commandes</th><th className="num">LTV</th></tr>
                </thead>
                <tbody>
                  {data.at_risk_urgent.map((c, i) => (
                    <tr key={i}>
                      <td className="strong">{c.name}</td>
                      <td><span style={{ color: SEG_COLOR[c.segment] || "inherit" }}>{c.segment}</span></td>
                      <td className="num" style={{ color: "var(--yellow-dk)" }}>{c.days_absent}j</td>
                      <td className="num muted">{c.cadence ? `${Math.round(c.cadence)}j` : "—"}</td>
                      <td className="num">{c.order_count}</td>
                      <td className="num">{fmt(c.total_spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cohort retention */}
          {data.cohorts.length > 0 && (
            <div className="mod-card">
              <div className="lc-mom-head">📅 Rétention par cohorte (acquisition)</div>
              <table className="sheet-table">
                <thead>
                  <tr><th>Cohorte</th><th className="num">Taille</th><th className="num">Repeat</th><th className="num">Cmd moy.</th><th className="num">LTV moy.</th><th className="num">Actifs 30j</th></tr>
                </thead>
                <tbody>
                  {data.cohorts.map((c) => (
                    <tr key={c.cohort}>
                      <td className="strong">{c.cohort}</td>
                      <td className="num">{fmt(c.size)}</td>
                      <td className="num">{c.repeat_rate}%</td>
                      <td className="num">{c.avg_orders}</td>
                      <td className="num">{fmt(c.avg_ltv)}</td>
                      <td className="num" style={{ color: c.active_30d_pct >= 30 ? "var(--mint-dk)" : "var(--ink-soft, #8a8f98)" }}>{c.active_30d_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
