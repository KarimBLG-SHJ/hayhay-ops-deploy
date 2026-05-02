import { useMemo, useState } from "react";
import { useReconciliation, type ReconRow } from "../api/useReconciliation";

const TOP_N = 15;

function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function dayName(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short" });
}

/** Color for delta_saisi_calc cell.
 *  >0  → équipe SUR-déclare (rouge clair)
 *  =0  → réconciliation parfaite (vert)
 *  <0  → équipe sous-déclare / oubli / vol (rouge foncé)
 *  null → pas de données (gris)
 */
function deltaColor(delta: number | null): { bg: string; fg: string } {
  if (delta === null || delta === undefined) return { bg: "rgba(255,255,255,0.04)", fg: "var(--text-3)" };
  const a = Math.min(1, Math.abs(delta) / 8);
  if (Math.abs(delta) <= 1) return { bg: `rgba(125, 211, 168, ${0.18 + a * 0.45})`, fg: "#0a1f15" };
  if (delta < 0)            return { bg: `rgba(239, 87, 87, ${0.20 + a * 0.55})`,  fg: "#fff" };
  return                       { bg: `rgba(255, 184, 76, ${0.22 + a * 0.55})`, fg: "#1a1108" };
}

export function ReconciliationPanel() {
  const [windowDays] = useState(7);
  const recon = useReconciliation(windowDays);
  const [hover, setHover] = useState<{ cid: string; date: string } | null>(null);

  // Build (top products by total revenue across the window) × (days)
  const { topProducts, byDay, totals } = useMemo(() => {
    const totalRev: Record<string, number> = {};
    const totalSold: Record<string, number> = {};
    Object.values(recon.byDay).forEach((day) => {
      day.rows.forEach((r) => {
        const cid = r.canonical_id;
        totalRev[cid] = (totalRev[cid] || 0) + (r.foodics_revenue || 0);
        totalSold[cid] = (totalSold[cid] || 0) + (r.foodics_qty || 0);
      });
    });
    const top = Object.keys(totalRev)
      .sort((a, b) => (totalRev[b] || 0) - (totalRev[a] || 0))
      .slice(0, TOP_N);

    const byDay: Record<string, Record<string, ReconRow>> = {};
    Object.entries(recon.byDay).forEach(([date, day]) => {
      const m: Record<string, ReconRow> = {};
      day.rows.forEach((r) => { m[r.canonical_id] = r; });
      byDay[date] = m;
    });

    return { topProducts: top, byDay, totals: { rev: totalRev, sold: totalSold } };
  }, [recon.byDay]);

  const dates = recon.days.map((d) => d.business_day); // newest first → reverse for left-to-right chrono

  if (recon.loading) {
    return (
      <section className="recon-panel">
        <div className="recon-head">
          <h2>Réconciliation Wastage · 7j</h2>
        </div>
        <div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div>
      </section>
    );
  }
  if (recon.error) {
    return (
      <section className="recon-panel">
        <div className="recon-head"><h2>Réconciliation Wastage · 7j</h2></div>
        <div className="recon-error">Erreur: {recon.error}</div>
      </section>
    );
  }

  const chronoDates = [...dates].reverse();

  return (
    <section className="recon-panel">
      <div className="recon-head">
        <h2>Réconciliation Wastage · 7j</h2>
        <div className="recon-sub">
          SR (J-1) + Drive Sheet (J) + Foodics (J) — Δ saisi vs calculé par produit
        </div>
      </div>

      {/* Daily summary cards */}
      <div className="recon-days">
        {chronoDates.map((d) => {
          const agg = recon.days.find((x) => x.business_day === d)!;
          const delta = agg.wastage_saisi_total - agg.wastage_calc_total;
          const c = deltaColor(delta);
          return (
            <div key={d} className="recon-day-card">
              <div className="recon-day-date">
                <span className="dn">{dayName(d)}</span>
                <span className="dd">{shortDate(d)}</span>
              </div>
              <div className="recon-day-grid">
                <div><b>{fmt(agg.products)}</b><span>produits</span></div>
                <div><b>{fmt(agg.sold_qty)}</b><span>vendus</span></div>
                <div><b>{fmt(agg.received)}</b><span>reçus</span></div>
                <div><b>{fmt(agg.wastage_calc_total)}</b><span>wast. calc</span></div>
              </div>
              <div className="recon-day-delta" style={{ background: c.bg, color: c.fg }}>
                Δ {delta > 0 ? "+" : ""}{fmt(delta)} <small>saisi vs calculé</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap product × jour */}
      <div className="recon-heatmap-wrap">
        <table className="recon-heatmap">
          <thead>
            <tr>
              <th className="prod-col">Produit (top {TOP_N} par CA)</th>
              <th className="rev-col">CA 7j</th>
              {chronoDates.map((d) => (
                <th key={d} className="day-col">{shortDate(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.map((cid) => (
              <tr key={cid}>
                <td className="prod-col">{cid}</td>
                <td className="rev-col">{fmt(totals.rev[cid] || 0)} د.إ</td>
                {chronoDates.map((d) => {
                  const r = byDay[d]?.[cid];
                  const c = deltaColor(r?.delta_saisi_calc ?? null);
                  const isHover = hover?.cid === cid && hover?.date === d;
                  return (
                    <td
                      key={d}
                      className="cell-col"
                      style={{ background: c.bg, color: c.fg }}
                      onMouseEnter={() => setHover({ cid, date: d })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="cell-main">
                        {r?.delta_saisi_calc !== null && r?.delta_saisi_calc !== undefined
                          ? (r.delta_saisi_calc > 0 ? "+" : "") + fmt(r.delta_saisi_calc)
                          : "—"}
                      </div>
                      {isHover && r && (
                        <div className="cell-tip">
                          <div>vendu <b>{fmt(r.foodics_qty)}</b></div>
                          <div>reçu <b>{fmt(r.drive_received)}</b></div>
                          <div>wast.calc <b>{fmt(r.wastage_calc)}</b></div>
                          <div>wast.saisi <b>{fmt(r.drive_wastage)}</b></div>
                          <div>SR <b>{fmt(r.sr_qty)}</b></div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="recon-legend">
        <span><i style={{ background: "rgba(125,211,168,0.55)" }}/> ±1 (réconcilié)</span>
        <span><i style={{ background: "rgba(255,184,76,0.55)" }}/> &gt; 0 (sur-déclare)</span>
        <span><i style={{ background: "rgba(239,87,87,0.55)" }}/> &lt; 0 (sous-déclare / oubli)</span>
        <span><i style={{ background: "rgba(255,255,255,0.04)" }}/> pas de donnée</span>
      </div>
    </section>
  );
}
