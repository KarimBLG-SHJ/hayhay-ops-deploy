import { useMemo } from "react";
import { useSheet, num } from "../api/sheet";

// Compact cockpit shortcut to the Recettes tab: avg food cost + FC>40 alerts.
// One click anywhere on the card opens #/recipes.

export function CockpitRecipesTile() {
  const sheet = useSheet("/recettes.csv");

  const k = useMemo(() => {
    // Group lines by product, keep the highest-price (sellable) variant.
    const primary = new Map<string, { price: number; fc: number }>();
    for (const r of sheet.rows) {
      const p = r["Produit"];
      if (!p) continue;
      const price = num(r["Prix_Vente_AED"]);
      const cur = primary.get(p);
      if (!cur || price > cur.price) primary.set(p, { price, fc: num(r["Food_Cost_%"]) });
    }
    const all = [...primary.entries()].map(([produit, v]) => ({ produit, ...v }));
    const sellable = all.filter((r) => r.price > 0);
    const avgFc = sellable.length
      ? sellable.reduce((s, r) => s + (Number.isFinite(r.fc) ? r.fc : 0), 0) / sellable.length
      : 0;
    const high = sellable
      .filter((r) => r.fc > 40)
      .sort((a, b) => b.fc - a.fc);
    return { total: all.length, sellable: sellable.length, avgFc, high };
  }, [sheet.rows]);

  const open = () => { window.location.hash = "#/recipes"; };

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") open(); }}
      style={{ cursor: "pointer", padding: "14px 16px" }}
      title="Ouvrir l'onglet Recettes"
    >
      <div className="card-head" style={{ padding: 0, marginBottom: 10 }}>
        <div className="card-title">🍳 Recettes</div>
        <div className="card-sub">{sheet.loading ? "…" : `${k.total} produits · ouvrir →`}</div>
      </div>

      {sheet.error ? (
        <div className="recon-error">Erreur: {sheet.error}</div>
      ) : (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
              {sheet.loading ? "—" : `${k.avgFc.toFixed(0)}%`}
            </div>
            <div className="card-sub" style={{ marginTop: 2 }}>food cost moyen</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1, color: "var(--pink-dk)" }}>
              {sheet.loading ? "—" : k.high.length}
            </div>
            <div className="card-sub" style={{ marginTop: 2 }}>🔴 FC &gt; 40%</div>
          </div>
          {k.high.length > 0 && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="card-sub" style={{ marginBottom: 4 }}>À corriger en priorité</div>
              {k.high.slice(0, 3).map((r) => (
                <div key={r.produit} style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, padding: "1px 0" }}>
                  <span>{r.produit}</span>
                  <span style={{ color: "var(--pink-dk)" }}>{r.fc.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
