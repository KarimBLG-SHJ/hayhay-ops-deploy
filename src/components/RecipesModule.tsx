import { useEffect, useMemo, useState } from "react";
import { useSheet, num } from "../api/sheet";

// Sapaad sub-recipe (prep) compositions, harvested for the 50 products whose
// menu recipe is a single self-referencing portion line. Keyed by normalized
// product name → real ingredient breakdown (grams + AED).
type PrepMap = Record<string, { prep: string; total: string; ing: [string, string, string, string, string][] }>;

// Central Sapaad recipe catalogue (both brands), exported to /recettes.csv.
// One CSV line per ingredient; product-level cost/price/food-cost repeat on
// each line. A product can hold several (cost, price) variants → we surface the
// sellable one (max price) as primary and list only its ingredients.

const C = {
  produit: "Produit",
  cost: "Cout_Produit_AED",
  price: "Prix_Vente_AED",
  fc: "Food_Cost_%",
  ingredient: "Ingredient",
  unite: "Unite",
  unitCost: "Cout_Unite_AED",
  qty: "Quantite",
  subTotal: "Sous_Total_Cout_AED",
  majPar: "Maj_Par",
};

interface Ingredient {
  name: string;
  unite: string;
  qty: number;
  unitCost: number;
  subTotal: number;
}
interface Recipe {
  produit: string;
  cost: number;
  price: number;
  fc: number;
  majPar: string;
  ingredients: Ingredient[];
  variants: number;
  detailed: boolean;        // false = recipe is just a self-referencing portion (no real breakdown)
  resolvedFrom?: string;    // ingredients pulled from this sub-recipe (Sapaad component)
}

const norm = (s: string | undefined) => (s || "").trim().toLowerCase();

const fcColor = (fc: number, price: number) =>
  price <= 0 ? "var(--ink-soft, #8a8f98)" : fc > 40 ? "var(--pink-dk)" : fc > 30 ? "var(--yellow-dk)" : "var(--mint-dk)";

type Filter = "all" | "sellable" | "semi" | "highfc";

export function RecipesModule() {
  const sheet = useSheet("/recettes.csv");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [preps, setPreps] = useState<PrepMap | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/recettes_preps.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setPreps(d))
      .catch(() => alive && setPreps(null));
    return () => { alive = false; };
  }, []);

  const { recipes, k } = useMemo(() => {
    // Group lines by product.
    const byProduct = new Map<string, Record<string, string>[]>();
    for (const r of sheet.rows) {
      const p = r[C.produit];
      if (!p) continue;
      (byProduct.get(p) ?? byProduct.set(p, []).get(p)!).push(r);
    }

    const recipes: Recipe[] = [];
    for (const [produit, lines] of byProduct) {
      // Distinct (cost, price) variants; primary = highest price.
      const variantKeys = new Set(lines.map((l) => `${l[C.cost]}|${l[C.price]}`));
      const primary = lines.reduce((best, l) =>
        num(l[C.price]) > num(best[C.price]) ? l : best, lines[0]);
      const pk = `${primary[C.cost]}|${primary[C.price]}`;
      const ingLines = lines.filter((l) => `${l[C.cost]}|${l[C.price]}` === pk);
      recipes.push({
        produit,
        cost: num(primary[C.cost]),
        price: num(primary[C.price]),
        fc: num(primary[C.fc]),
        majPar: primary[C.majPar] || "—",
        variants: variantKeys.size,
        ingredients: ingLines.map((l) => ({
          name: l[C.ingredient],
          unite: l[C.unite],
          qty: num(l[C.qty]),
          unitCost: num(l[C.unitCost]),
          subTotal: num(l[C.subTotal]),
        })),
        detailed: false,
      });
    }

    // Sapaad often stores a finished product as a single line pointing to a
    // same-named "portion" (self-reference → no real breakdown) or to another
    // catalogue product (a sub-recipe). Resolve the latter, flag the former.
    const byName = new Map(recipes.map((r) => [norm(r.produit), r]));
    const rawDetailed = (r: Recipe) =>
      r.ingredients.length > 0 && r.ingredients.some((i) => norm(i.name) !== norm(r.produit));
    for (const r of recipes) {
      if (rawDetailed(r)) { r.detailed = true; continue; }
      // Single line that points to a *different* product → pull that recipe's lines.
      if (r.ingredients.length === 1 && norm(r.ingredients[0].name) !== norm(r.produit)) {
        const target = byName.get(norm(r.ingredients[0].name));
        if (target && rawDetailed(target)) {
          r.ingredients = target.ingredients;
          r.resolvedFrom = target.produit;
          r.detailed = true;
          continue;
        }
      }
      // Self-reference: fill in the real composition harvested from the
      // Sapaad sub-recipe (grams + AED), if we have it.
      const p = preps && preps[norm(r.produit)];
      if (p && p.ing && p.ing.length) {
        r.ingredients = p.ing.map((a) => ({
          name: a[0], unite: a[1], unitCost: num(a[2]), qty: num(a[3]), subTotal: num(a[4]),
        }));
        r.detailed = true;
        continue;
      }
      // Otherwise: opaque self-reference, no usable ingredient list.
      r.ingredients = [];
      r.detailed = false;
    }
    recipes.sort((a, b) => a.produit.localeCompare(b.produit));

    const sellable = recipes.filter((r) => r.price > 0);
    const avgFc = sellable.length
      ? sellable.reduce((s, r) => s + (Number.isFinite(r.fc) ? r.fc : 0), 0) / sellable.length
      : 0;
    const highFc = sellable.filter((r) => r.fc > 40).length;

    return {
      recipes,
      k: { total: recipes.length, sellable: sellable.length, semi: recipes.length - sellable.length, avgFc, highFc },
    };
  }, [sheet.rows, preps]);

  const view = useMemo(() => {
    let r = recipes;
    if (filter === "sellable") r = r.filter((x) => x.price > 0);
    else if (filter === "semi") r = r.filter((x) => x.price <= 0);
    else if (filter === "highfc") r = r.filter((x) => x.price > 0 && x.fc > 40);
    const term = q.trim().toLowerCase();
    if (term) r = r.filter((x) =>
      x.produit.toLowerCase().includes(term) ||
      x.ingredients.some((i) => i.name.toLowerCase().includes(term)));
    return r;
  }, [recipes, filter, q]);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">🍳 Recettes</h1>
          <div className="mod-sub">
            Catalogue recettes central Sapaad · {sheet.rows.length} lignes d'ingrédients · coût matière par produit
          </div>
        </div>
      </div>

      {sheet.loading ? (
        <div className="mod-card"><div className="tile-loading"><span className="tile-spinner" /><span>Chargement…</span></div></div>
      ) : sheet.error ? (
        <div className="mod-card"><div className="recon-error">Erreur: {sheet.error}</div></div>
      ) : (
        <>
          <div className="stock-kpis">
            <div className="stock-kpi"><div className="stock-kpi-lab">Recettes</div><div className="stock-kpi-val">{k.total}</div><div className="stock-kpi-sub">produits au catalogue</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Vendables</div><div className="stock-kpi-val" style={{ color: "var(--mint-dk)" }}>{k.sellable}</div><div className="stock-kpi-sub">prix de vente &gt; 0</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Semi-finis</div><div className="stock-kpi-val" style={{ color: "#3E7AC0" }}>{k.semi}</div><div className="stock-kpi-sub">composants / sous-recettes</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">Food cost moyen</div><div className="stock-kpi-val">{k.avgFc.toFixed(0)}%</div><div className="stock-kpi-sub">produits vendables</div></div>
            <div className="stock-kpi"><div className="stock-kpi-lab">🔴 FC &gt; 40%</div><div className="stock-kpi-val" style={{ color: "var(--pink-dk)" }}>{k.highFc}</div><div className="stock-kpi-sub">marge à corriger</div></div>
          </div>

          <div className="lc-pills" style={{ alignItems: "center" }}>
            <button className={`lc-pill ${filter === "all" ? "lc-pill-on" : ""}`} onClick={() => setFilter("all")}>Tous ({k.total})</button>
            <button className={`lc-pill lc-green ${filter === "sellable" ? "lc-pill-on" : ""}`} onClick={() => setFilter("sellable")}>Vendables ({k.sellable})</button>
            <button className={`lc-pill lc-blue ${filter === "semi" ? "lc-pill-on" : ""}`} onClick={() => setFilter("semi")}>Semi-finis ({k.semi})</button>
            <button className={`lc-pill lc-amber ${filter === "highfc" ? "lc-pill-on" : ""}`} onClick={() => setFilter("highfc")}>FC élevé ({k.highFc})</button>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher produit ou ingrédient…"
              style={{
                marginLeft: "auto", minWidth: 240, padding: "7px 12px", fontSize: 13,
                fontFamily: "'Nunito', sans-serif", border: "1px solid var(--line, #e3e0d8)",
                borderRadius: 999, background: "var(--surface, #fff)", color: "var(--text)", outline: "none",
              }}
            />
          </div>

          <div className="mod-card">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Produit</th>
                  <th className="num">Coût AED</th>
                  <th className="num">Prix AED</th>
                  <th className="num">Food cost</th>
                  <th className="num">Ingrédients</th>
                  <th>Maj par</th>
                </tr>
              </thead>
              <tbody>
                {view.map((r) => {
                  const isOpen = open === r.produit && r.detailed;
                  return [
                    <tr
                      key={r.produit}
                      onClick={() => r.detailed && setOpen(isOpen ? null : r.produit)}
                      style={{ cursor: r.detailed ? "pointer" : "default" }}
                    >
                      <td className="muted" style={{ textAlign: "center" }}>{r.detailed ? (isOpen ? "▾" : "▸") : ""}</td>
                      <td className="strong">
                        {r.produit}
                        {r.variants > 1 ? <span className="muted" style={{ fontWeight: 400 }}> · {r.variants} variantes</span> : null}
                        {r.resolvedFrom && norm(r.resolvedFrom) !== norm(r.produit) ? <span className="muted" style={{ fontWeight: 400 }}> · via {r.resolvedFrom}</span> : null}
                      </td>
                      <td className="num">{Number.isFinite(r.cost) ? r.cost.toFixed(2) : "—"}</td>
                      <td className="num">{r.price > 0 ? r.price.toFixed(0) : <span className="muted">—</span>}</td>
                      <td className="num" style={{ color: fcColor(r.fc, r.price), fontWeight: 800 }}>
                        {r.price > 0 && Number.isFinite(r.fc) ? r.fc.toFixed(1) + "%" : "—"}
                      </td>
                      <td className="num">
                        {r.detailed ? r.ingredients.length : <span className="muted" style={{ fontSize: 11 }}>non détaillée</span>}
                      </td>
                      <td className="muted">{r.majPar}</td>
                    </tr>,
                    isOpen ? (
                      <tr key={r.produit + "-ing"}>
                        <td></td>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <table className="sheet-table" style={{ margin: "4px 0 10px", background: "var(--surface-2, #faf8f3)" }}>
                            <thead>
                              <tr>
                                <th>Ingrédient</th>
                                <th className="num">Quantité</th>
                                <th>Unité</th>
                                <th className="num">Coût unité</th>
                                <th className="num">Sous-total AED</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.ingredients.map((ing, j) => (
                                <tr key={j}>
                                  <td>{ing.name}</td>
                                  <td className="num">{Number.isFinite(ing.qty) ? ing.qty : "—"}</td>
                                  <td className="muted">{ing.unite}</td>
                                  <td className="num">{Number.isFinite(ing.unitCost) ? ing.unitCost.toFixed(3) : "—"}</td>
                                  <td className="num">{Number.isFinite(ing.subTotal) ? ing.subTotal.toFixed(2) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
