import { useEffect, useState } from "react";
import type { Snapshot } from "../types";

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

interface Props { snap: Snapshot }

export function BottomRow({ snap }: Props) {
  const { supervisor, context, lifecycle_breakdown, sector_yield } = snap;
  const [sessionS, setSessionS] = useState(supervisor.uptime_session_s);

  useEffect(() => {
    setSessionS(supervisor.uptime_session_s);
    const id = window.setInterval(() => setSessionS((s) => s + 15), 15000);
    return () => window.clearInterval(id);
  }, [supervisor.uptime_session_s]);

  const topCats = sector_yield.slice(0, 3);

  const weatherTags = context.tags.filter((t) => t.on && !/^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim)$/.test(t.k));
  const weatherForecast = weatherTags.length > 0
    ? weatherTags.map((t) => t.k).join(" · ")
    : "☀️ 35°C Sharjah";

  const lc = lifecycle_breakdown;

  return (
    <div className="bottom-row">
      {/* Session */}
      <div className="bottom-card">
        <div className="bottom-label">Session</div>
        <div className="bottom-value">{fmtDuration(sessionS)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="live-dot-green" />
          <div className="bottom-sub">Agent actif</div>
        </div>
      </div>

      {/* API */}
      <div className="bottom-card">
        <div className="bottom-label">Appels API</div>
        <div className="bottom-value">{supervisor.api_calls.toLocaleString()}</div>
        <div className="bottom-sub">Aujourd'hui</div>
      </div>

      {/* Slack */}
      <div className="bottom-card">
        <div className="bottom-label">Posts Slack</div>
        <div className="bottom-value">{supervisor.slack_posts}</div>
        <div className="bottom-sub">Messages envoyés</div>
      </div>

      {/* Weather */}
      <div className="bottom-card">
        <div className="bottom-label">Météo</div>
        <div className="bottom-value" style={{ fontSize: 16, fontFamily: 'Nunito', fontWeight: 800 }}>
          {weatherForecast}
        </div>
        <div className="bottom-sub">Sharjah</div>
      </div>

      {/* Lifecycle */}
      <div className="bottom-card">
        <div className="bottom-label">Catalogue</div>
        <div className="bottom-value">{lc?.total ?? "—"}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
          {lc?.zombie_count ? (
            <span style={{ fontSize: 10, fontFamily: 'Nunito', fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: '#FFE4EA', color: 'var(--pink-dk)' }}>
              {lc.zombie_count} zombies
            </span>
          ) : null}
          {lc?.by_status?.new_launch ? (
            <span style={{ fontSize: 10, fontFamily: 'Nunito', fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: '#D9F4E6', color: 'var(--mint-dk)' }}>
              {lc.by_status.new_launch} new
            </span>
          ) : null}
        </div>
      </div>

      {/* Categories */}
      <div className="bottom-card">
        <div className="bottom-label">Top Catégories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {topCats.map((c) => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>
                {c.name}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                {c.ca} AED
              </span>
            </div>
          ))}
          {topCats.length === 0 && (
            <div className="bottom-sub">En cours…</div>
          )}
        </div>
      </div>
    </div>
  );
}
