import { useEffect, useState } from "react";
import type { Snapshot } from "../types";

const NAV_ITEMS = [
  { icon: "⬡", label: "Vue d'ensemble", badge: null, active: true },
  { icon: "🤖", label: "Agents IA", badge: "8", active: false },
  { icon: "🛒", label: "Commandes", badge: "24", active: false },
  { icon: "📈", label: "Tickets & CA", badge: null, active: false },
  { icon: "🍳", label: "Cuisine & Stocks", badge: null, active: false },
  { icon: "👥", label: "Clients & VIP", badge: null, active: false },
  { icon: "📋", label: "Rapports", badge: null, active: false },
  { icon: "⚙️", label: "Paramètres", badge: null, active: false },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function uaeNow() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: Date) {
  const day = DAYS_FR[(d.getDay() + 6) % 7];
  return `${day} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

interface Props {
  snap: Snapshot;
}

export function Sidebar({ snap }: Props) {
  const [now, setNow] = useState(uaeNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(uaeNow()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const { supervisor, lifecycle_breakdown, sector_yield } = snap;
  const [sessionS, setSessionS] = useState(supervisor.uptime_session_s);
  useEffect(() => {
    setSessionS(supervisor.uptime_session_s);
    const id = window.setInterval(() => setSessionS((s) => s + 15), 15000);
    return () => window.clearInterval(id);
  }, [supervisor.uptime_session_s]);

  const tempTag = snap.context.tags.find((t) => /°C/.test(t.k));
  const tempStr = tempTag ? tempTag.k : "34°C";
  const weatherStr = `☀️ ${tempStr} SHARJAH`;

  const topCats = sector_yield.slice(0, 3);
  const lc = lifecycle_breakdown;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-dot">🍳</div>
        <div>
          <div className="brand-name">HAYHAY <span>OPS</span></div>
          <div className="brand-tagline">AI Restaurant Board</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.label} className={`nav-item${item.active ? " active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      {/* Mascot card */}
      <div className="mascot-card">
        <div className="mascot-copy">
          L'ÉQUIPE EN CUISINE,<br />LES DONNÉES <em>EN SAUCE!</em>
        </div>
        <img
          src="/mascots/HH-OPS.jpg"
          alt="HayHay mascot"
          className="mascot-img"
        />
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="user-avatar">👨‍🍳</div>
        <div className="user-info">
          <div className="user-role">Connecté en tant que</div>
          <div className="user-name">HAYHAY BOSS</div>
        </div>
        <span className="live-dot-green" />
      </div>

      {/* Clock + Weather */}
      <div className="sidebar-clock">
        <div>
          <div className="clock-time">{formatTime(now)}</div>
          <div style={{ marginTop: 4 }}>
            <div className="clock-weather">
              <span>{weatherStr}</span>
            </div>
          </div>
        </div>
        <div className="clock-date">{formatDate(now)}</div>
      </div>

      {/* Compact stats (ex-BottomRow) */}
      <div className="sidebar-stats">
        <div className="sb-stat">
          <div className="sb-stat-label">Session</div>
          <div className="sb-stat-value">{fmtDuration(sessionS)}</div>
          <div className="sb-stat-sub"><span className="live-dot-green" />Agent actif</div>
        </div>

        <div className="sb-stat-grid">
          <div className="sb-stat-mini">
            <div className="sb-stat-label">Appels API</div>
            <div className="sb-stat-value">{supervisor.api_calls.toLocaleString()}</div>
          </div>
          <div className="sb-stat-mini">
            <div className="sb-stat-label">Slack</div>
            <div className="sb-stat-value">{supervisor.slack_posts}</div>
          </div>
        </div>

        <div className="sb-stat">
          <div className="sb-stat-label">Catalogue</div>
          <div className="sb-stat-value">{lc?.total ?? "—"}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {lc?.zombie_count ? (
              <span className="sb-chip sb-chip-pink">{lc.zombie_count} zombies</span>
            ) : null}
            {lc?.by_status?.new_launch ? (
              <span className="sb-chip sb-chip-mint">{lc.by_status.new_launch} new</span>
            ) : null}
          </div>
        </div>

        {topCats.length > 0 && (
          <div className="sb-stat">
            <div className="sb-stat-label">Top Catégories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {topCats.map((c) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {c.name}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                    {c.ca} AED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
