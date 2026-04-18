import { TileHead, openUrl } from "./primitives";
import type { AlJadaScore } from "../types";

export function AlJadaBrief({ data }: { data: AlJadaScore | undefined }) {
  const url = "https://al-jada-watch-production.up.railway.app";
  if (!data) {
    return (
      <div className="tile">
        <TileHead title="AL-JADA BRIEF" sub="Score du jour Aljada · chargement..." />
      </div>
    );
  }
  const scoreColor = data.day_score_pct >= 60 ? "#7ee787" : data.day_score_pct >= 40 ? "#e8c547" : "#ff8a8a";
  const subs = [
    { k: "Traffic", v: data.traffic_pct },
    { k: "Social", v: data.social_pct },
    { k: "Presse", v: data.press_pct },
    { k: "Concurrence", v: data.competition_pct },
  ];
  return (
    <div className="tile clickable" title="Ouvrir Al-Jada Watch" onClick={() => openUrl(url)}>
      <TileHead
        title="AL-JADA BRIEF"
        sub="Score du jour Aljada · trafic, social, presse, concurrence, événements"
        meta={`${data.event_count} ÉVTS`}
      />
      <div className="aljada-wrap">
        <div className="aljada-top">
          <div className="aljada-score" style={{ color: scoreColor }}>
            {data.day_score_pct}
            <span className="lab">/100</span>
          </div>
          <div className="aljada-label">{data.day_label}</div>
        </div>
        {data.temp_c !== undefined && (
          <div className="aljada-weather">
            {Math.round(data.temp_c)}°C · {data.condition || ""}
          </div>
        )}
        <div className="aljada-brief">{data.brief}</div>
        <div className="aljada-subscores">
          {subs.map((s) => (
            <div key={s.k} className="aljada-sub">
              <span className="k">{s.k}</span>
              <span className="v">{s.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
