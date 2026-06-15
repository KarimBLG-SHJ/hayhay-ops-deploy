import { useMemo } from "react";
import { useReconciliation } from "../api/useReconciliation";
import { ReconciliationPanel } from "./ReconciliationPanel";

/**
 * Stock & waste — native module built on the live wastage reconciliation
 * (coach /api/wastage_reconciliation). 7-day summary KPIs on top of the
 * existing reconciliation heatmap + flops table.
 */
function fmt(n: number, d = 0): string {
  return Number(n).toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d });
}

export function StockModule() {
  const recon = useReconciliation(7);

  const k = useMemo(() => {
    const days = recon.days || [];
    const sum = (f: (d: typeof days[number]) => number) => days.reduce((s, d) => s + (f(d) || 0), 0);
    const received = sum((d) => d.received);
    const sold = sum((d) => d.sold_qty);
    const wasted = sum((d) => d.wastage_calc_total);
    const wastageAed = sum((d) => d.wastage_aed_total ?? 0);
    const revenue = sum((d) => d.revenue);
    const sellThrough = received > 0 ? (sold / received) * 100 : 0;
    return { received, sold, wasted, wastageAed, revenue, sellThrough, hasAed: wastageAed > 0 };
  }, [recon.days]);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">📦 Stock &amp; waste</h1>
          <div className="mod-sub">Réconciliation 3 sources (SR + Drive + Foodics) · fenêtre 7 jours</div>
        </div>
      </div>

      {recon.loading ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div></div>
      ) : recon.error ? (
        <div className="mod-card"><div className="recon-error">Erreur: {recon.error}</div></div>
      ) : (
        <>
          <div className="stock-kpis">
            <div className="stock-kpi">
              <div className="stock-kpi-lab">Reçu 7j</div>
              <div className="stock-kpi-val">{fmt(k.received)}</div>
              <div className="stock-kpi-sub">unités mises en place</div>
            </div>
            <div className="stock-kpi">
              <div className="stock-kpi-lab">Vendu 7j</div>
              <div className="stock-kpi-val">{fmt(k.sold)}</div>
              <div className="stock-kpi-sub">{fmt(k.revenue)} AED</div>
            </div>
            <div className="stock-kpi">
              <div className="stock-kpi-lab">Sell-through</div>
              <div className="stock-kpi-val" style={{ color: k.sellThrough < 60 ? "var(--pink-dk)" : "var(--mint-dk)" }}>
                {fmt(k.sellThrough, 1)}%
              </div>
              <div className="stock-kpi-sub">vendu / reçu</div>
            </div>
            <div className="stock-kpi">
              <div className="stock-kpi-lab">Jeté 7j</div>
              <div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{fmt(k.wasted)}</div>
              <div className="stock-kpi-sub">unités (calculé)</div>
            </div>
            {k.hasAed && (
              <div className="stock-kpi stock-kpi-accent">
                <div className="stock-kpi-lab">Coût jeté 7j</div>
                <div className="stock-kpi-val">{fmt(k.wastageAed)} <span style={{ fontSize: 13 }}>د.إ</span></div>
                <div className="stock-kpi-sub">COGS perdu</div>
              </div>
            )}
          </div>

          <ReconciliationPanel />
        </>
      )}
    </main>
  );
}
