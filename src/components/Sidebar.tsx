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

interface Props {
  snap: Snapshot;
}

export function Sidebar({ snap }: Props) {
  const [now, setNow] = useState(uaeNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(uaeNow()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const tempTag = snap.context.tags.find((t) => /°C/.test(t.k));
  const tempStr = tempTag ? tempTag.k : "34°C";
  const weatherStr = `☀️ ${tempStr} SHARJAH`;

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
    </aside>
  );
}
