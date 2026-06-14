import type { Snapshot } from "../types";

/**
 * Context — native module built from data already in the snapshot
 * (snap.aljada from contextos /forecast/daily, snap.context tags).
 * No new network calls.
 */

function Gauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="ctx-gauge">
      <div className="ctx-gauge-top">
        <span className="ctx-gauge-label">{label}</span>
        <span className="ctx-gauge-pct">{Math.round(pct)}%</span>
      </div>
      <div className="ctx-gauge-track">
        <div className="ctx-gauge-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

export function ContextModule({ snap }: { snap: Snapshot }) {
  const a = snap.aljada;
  const ctx = snap.context;

  if (!a) {
    return (
      <main className="main-col">
        <div className="mod-head">
          <div>
            <h1 className="mod-title">☁️ Context</h1>
            <div className="mod-sub">Drivers externes · contextos</div>
          </div>
        </div>
        <div className="mod-card">
          <div className="mod-empty">Données contexte indisponibles pour le moment.</div>
        </div>
      </main>
    );
  }

  const score = Math.round(a.day_score_pct ?? 0);
  const tags = (ctx?.tags ?? []).filter((t) => t.on);

  return (
    <main className="main-col">
      <div className="mod-head">
        <div>
          <h1 className="mod-title">☁️ Context</h1>
          <div className="mod-sub">Drivers externes du jour · indice d'influence base 100</div>
        </div>
      </div>

      <div className="mod-row">
        {/* Score du jour */}
        <div className="mod-card mod-card-narrow">
          <div className="mod-card-title">Indice du jour</div>
          <div className="ctx-score">
            <div className="ctx-score-val">{score}</div>
            <div className="ctx-score-lab">{a.day_label || "—"}</div>
          </div>
          {(a.temp_c != null || a.condition) && (
            <div className="ctx-weather">
              {a.condition ? `${a.condition} · ` : ""}
              {a.temp_c != null ? `${Math.round(a.temp_c)}°C` : ""}
            </div>
          )}
        </div>

        {/* Brief */}
        <div className="mod-card">
          <div className="mod-card-title">Lecture du jour</div>
          <div className="ctx-brief">{a.brief || "Pas de note pour aujourd'hui."}</div>
          {a.event_count > 0 && (
            <div className="ctx-events">📅 {a.event_count} {a.event_count > 1 ? "événements locaux" : "événement local"} à proximité</div>
          )}
        </div>
      </div>

      {/* Signaux décomposés */}
      <div className="mod-card">
        <div className="mod-card-title">Décomposition de l'indice</div>
        <div className="ctx-gauges">
          <Gauge label="Trafic" pct={a.traffic_pct ?? 0} color="var(--sky)" />
          <Gauge label="Social" pct={a.social_pct ?? 0} color="var(--pink)" />
          <Gauge label="Presse" pct={a.press_pct ?? 0} color="var(--yellow)" />
          <Gauge label="Concurrence" pct={a.competition_pct ?? 0} color="var(--purple)" />
        </div>
      </div>

      {/* Drivers actifs */}
      {tags.length > 0 && (
        <div className="mod-card">
          <div className="mod-card-title">Drivers actifs ({ctx?.n_signals ?? tags.length})</div>
          <div className="ctx-tags">
            {tags.map((t) => (
              <span className="ctx-tag" key={t.k}>{t.k}</span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
