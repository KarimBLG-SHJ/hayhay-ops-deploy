import { TileHead, openUrl } from "./primitives";
import type { IaAccuracy } from "../types";

export function IaAccuracyTile({ data }: { data: IaAccuracy | undefined }) {
  const url = "https://worker-production-c3a3.up.railway.app/api/learning/product-accuracy";
  if (!data) {
    return (
      <div className="tile">
        <TileHead title="PERFORMANCE ALGO IA" sub="Prédictions vs réel · chargement..." />
      </div>
    );
  }
  // Overall accuracy = 1 - (MAE / actual avg), clamped 0-100
  const accuracyPct = data.actual_total_avg > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (data.mae_total_avg / data.actual_total_avg) * 100)))
    : 0;
  const accuracyColor = accuracyPct >= 70 ? "#7ee787" : accuracyPct >= 50 ? "#e8c547" : "#ff8a8a";
  return (
    <div className="tile clickable" title="Ouvrir détail accuracy par produit" onClick={() => openUrl(url)}>
      <TileHead
        title="PERFORMANCE ALGO IA"
        sub={`Prédictions batch vs réel · ${data.days}j glissants · MAE = écart moyen en unités`}
        meta={`${data.days}j`}
      />
      <div className="ia-wrap">
        <div className="ia-top">
          <div className="ia-accuracy" style={{ color: accuracyColor }}>
            {accuracyPct}%
            <span className="lab">ACCURACY</span>
          </div>
          <div className="ia-stats">
            <div>
              <span className="v">{data.predicted_total_avg}</span>
              <span className="k">PRÉDIT/j</span>
            </div>
            <div>
              <span className="v">{data.actual_total_avg}</span>
              <span className="k">RÉEL/j</span>
            </div>
            <div>
              <span className="v" style={{ color: accuracyColor }}>±{data.mae_total_avg}</span>
              <span className="k">MAE</span>
            </div>
          </div>
        </div>
        {data.top_products.length > 0 && (
          <div className="ia-worst">
            <div className="ia-worst-head">TOP 5 ÉCARTS (MAE le plus haut)</div>
            {data.top_products.map((p) => (
              <div key={p.product} className="ia-worst-row">
                <span className="name">{p.product}</span>
                <span className="mae">±{p.mae}</span>
                <span className={"bias " + (p.bias > 0 ? "over" : "under")}>
                  {p.bias > 0 ? "sur-prédit" : "sous-prédit"} {Math.abs(p.bias)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
