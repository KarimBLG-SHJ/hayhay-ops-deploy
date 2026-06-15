import { useMemo } from "react";
import { useSheet, num } from "../api/sheet";

const C = {
  sku: "HayHay SKU",
  cat: "Category",
  cogs: "COGS (AED)",
  price: "HayHay Price (AED)",
  margin: "Margin %",
  profit: "Profit (AED)",
  alert: "Alert",
};

function alertClass(a: string): string {
  if (a.includes("🔴")) return "cogs-pill cogs-red";
  if (a.includes("🟠")) return "cogs-pill cogs-amber";
  if (a.includes("🟡")) return "cogs-pill cogs-yellow";
  return "cogs-pill cogs-green";
}

export function CogsModule() {
  const sheet = useSheet("/api/cogs");

  const { rows, k } = useMemo(() => {
    const rows = sheet.rows
      .filter((r) => r[C.sku] && Number.isFinite(num(r[C.price])))
      .map((d) => ({ d, m: num(d[C.margin]) }))
      .sort((a, b) => (a.m || 0) - (b.m || 0));
    const valid = rows.filter((r) => Number.isFinite(r.m));
    const avg = valid.length ? valid.reduce((s, r) => s + r.m, 0) / valid.length : 0;
    const risk = rows.filter((r) => r.d[C.alert]?.includes("🔴")).length;
    const low = rows.filter((r) => r.d[C.alert]?.includes("🟠")).length;
    return { rows, k: { total: rows.length, avg, risk, low } };
  }, [sheet.rows]);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">💰 COGS &amp; marges</h1>
          <div className="mod-sub">Source Drive → Sapaad → Foodics · Google Sheet validé · trié par marge ↑</div>
        </div>
      </div>

      {sheet.loading ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div></div>
      ) : sheet.error ? (
        <div className="mod-card"><div className="recon-error">Erreur: {sheet.error}</div></div>
      ) : (
        <>
          <div className="stock-kpis">
            <div className="stock-kpi"><div className="stock-kpi-lab">Produits</div><div className="stock-kpi-val">{k.total}</div><div className="stock-kpi-sub">SKU avec COGS</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Marge moyenne</div><div className="stock-kpi-val">{k.avg.toFixed(0)}%</div><div className="stock-kpi-sub">tous produits</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">🔴 High risk</div><div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{k.risk}</div><div className="stock-kpi-sub">marge critique</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">🟠 Low margin</div><div className="stock-kpi-val" style={{ color: "var(--yellow-dk)" }}>{k.low}</div><div className="stock-kpi-sub">à surveiller</div></div>
          </div>

          <div className="mod-card">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Produit</th><th>Catégorie</th>
                  <th className="num">COGS</th><th className="num">Prix</th>
                  <th className="num">Marge %</th><th className="num">Profit</th><th>Alerte</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ d, m }, i) => (
                  <tr key={i}>
                    <td className="strong">{d[C.sku]}</td>
                    <td className="muted">{d[C.cat]}</td>
                    <td className="num">{num(d[C.cogs]).toFixed(2)}</td>
                    <td className="num">{num(d[C.price]).toFixed(0)}</td>
                    <td className="num" style={{ color: m < 0 ? "var(--pink-dk)" : m < 28 ? "var(--yellow-dk)" : "var(--mint-dk)", fontWeight: 800 }}>
                      {Number.isFinite(m) ? m.toFixed(1) + "%" : "—"}
                    </td>
                    <td className="num">{num(d[C.profit]).toFixed(2)}</td>
                    <td><span className={alertClass(d[C.alert] || "")}>{(d[C.alert] || "—").replace(/[🔴🟠🟡🟢]/g, "").trim() || "OK"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
