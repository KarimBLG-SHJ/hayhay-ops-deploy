import type { NavItem } from "./nav";

/**
 * Scaffold view for a module whose native screen isn't wired yet (Phase 2).
 * Honest about state — never fakes data. Lists the backend it will consume.
 */
const PLANNED: Record<string, { blurb: string; source: string }> = {
  sales: {
    blurb: "Ventes détaillées : courbe CA, mix canal, panier moyen, top produits, comparaisons J-1/J-7.",
    source: "dashboard-deploy · /api/daily · /api/batch",
  },
  cogs: {
    blurb: "COGS & marges par produit, source Drive → Sapaad → Foodics, alertes seuils marge.",
    source: "Google Sheet COGS · analytics/sync_product_costs.py",
  },
  talabat: {
    blurb: "Marges Talabat COMM/FULL, produits en perte, funnel, ads CPC/ROAS, settlements.",
    source: "talabat.db · talabat-analytics-bot",
  },
  stock: {
    blurb: "Stock request, batch livré, wastage 3 sources, sell-through, sold-out.",
    source: "Postgres stock_request · wastage reconciliation",
  },
  context: {
    blurb: "Drivers externes : météo, Ramadan/Eid, écoles, pay-cycle, events Sharjah, forecast J+14.",
    source: "contextos · /forecast/daily · /events/major",
  },
};

export function ModulePlaceholder({ item }: { item: NavItem }) {
  const info = PLANNED[item.id];
  return (
    <main className="main-col">
      <div className="module-stub">
        <div className="module-stub-icon">{item.icon}</div>
        <h1 className="module-stub-title">{item.label}</h1>
        <div className="module-stub-tag">Module natif — en construction</div>
        {info && (
          <>
            <p className="module-stub-blurb">{info.blurb}</p>
            <div className="module-stub-source">
              <span>Source de données</span>
              <code>{info.source}</code>
            </div>
          </>
        )}
        <div className="module-stub-hint">
          Le Cockpit agrège déjà l'essentiel. Cette vue détaillée arrive en Phase 2.
        </div>
      </div>
    </main>
  );
}
