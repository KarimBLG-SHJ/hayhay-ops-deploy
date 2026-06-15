import { useMemo } from "react";
import { useSheet, num } from "../api/sheet";

const C = {
  cat: "Catégorie",
  prod: "Produit",
  price: "Prix AED",
  cogs: "COGS AED",
  vol: "Vol 30j",
  brute: "Marge Brute",
  nette: "Marge Nette Talabat",
  reste: "Reste Net AED",
  note: "Note",
};

export function TalabatModule() {
  const sheet = useSheet("/api/talabat-margins");

  const { rows, k } = useMemo(() => {
    const rows = sheet.rows
      .filter((r) => r[C.prod] && Number.isFinite(num(r[C.price])))
      .map((d) => ({ d, n: num(d[C.nette]) }))
      .sort((a, b) => (a.n || 0) - (b.n || 0));
    const valid = rows.filter((r) => Number.isFinite(r.n));
    const avg = valid.length ? valid.reduce((s, r) => s + r.n, 0) / valid.length : 0;
    const remove = rows.filter((r) => r.d[C.note]?.includes("🚨")).length;
    const loss = rows.filter((r) => Number.isFinite(r.n) && r.n < 0).length;
    return { rows, k: { total: rows.length, avg, remove, loss } };
  }, [sheet.rows]);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">🛵 Talabat — marges produit</h1>
          <div className="mod-sub">Marge nette après commission + marketing · trié par marge nette ↑ (pires d'abord)</div>
        </div>
      </div>

      {sheet.loading ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div></div>
      ) : sheet.error ? (
        <div className="mod-card"><div className="recon-error">Erreur: {sheet.error}</div></div>
      ) : (
        <>
          <div className="stock-kpis">
            <div className="stock-kpi"><div className="stock-kpi-lab">Produits</div><div className="stock-kpi-val">{k.total}</div><div className="stock-kpi-sub">sur Talabat</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Marge nette moy.</div><div className="stock-kpi-val">{k.avg.toFixed(0)}%</div><div className="stock-kpi-sub">après fees + ads</div></div>
            <div className="stock-kpi stock-kpi-accent"><div className="stock-kpi-lab">🚨 À retirer</div><div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{k.remove}</div><div className="stock-kpi-sub">marge trop basse</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">En perte</div><div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{k.loss}</div><div className="stock-kpi-sub">marge nette &lt; 0</div></div>
          </div>

          <div className="mod-card">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Produit</th><th>Catégorie</th>
                  <th className="num">Prix</th><th className="num">COGS</th><th className="num">Vol 30j</th>
                  <th className="num">Marge brute</th><th className="num">Marge nette</th><th className="num">Reste AED</th><th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ d, n }, i) => (
                  <tr key={i}>
                    <td className="strong">{d[C.prod]}</td>
                    <td className="muted">{d[C.cat]}</td>
                    <td className="num">{num(d[C.price]).toFixed(1)}</td>
                    <td className="num">{num(d[C.cogs]).toFixed(2)}</td>
                    <td className="num">{d[C.vol] || "—"}</td>
                    <td className="num">{d[C.brute] || "—"}</td>
                    <td className="num" style={{ color: n < 0 ? "var(--pink-dk)" : n < 15 ? "var(--yellow-dk)" : "var(--mint-dk)", fontWeight: 800 }}>
                      {Number.isFinite(n) ? n.toFixed(1) + "%" : "—"}
                    </td>
                    <td className="num">{num(d[C.reste]).toFixed(2)}</td>
                    <td className="note">{d[C.note] || "—"}</td>
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
