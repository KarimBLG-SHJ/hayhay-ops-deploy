import type { Snapshot } from "../types";

const AGENTS = [
  { name: "Client Briefing", tint: "purple", emoji: "📋", mascot: "/mascots/HH-OPS.jpg",      uptime: "98%", url: "https://hayhay-management-production.up.railway.app/" },
  { name: "Dose Accuracy",   tint: "mint",   emoji: "🎯", mascot: "/mascots/HH-Eval.jpg",     uptime: "96%", url: "https://web-production-fbd5f.up.railway.app/" },
  { name: "Supervision",     tint: "pink",   emoji: "👀", mascot: "/mascots/HH-watch.jpg",    uptime: "99%", url: "https://hayhay-management-production.up.railway.app/" },
  { name: "Résultats",       tint: "yellow", emoji: "📊", mascot: "/mascots/HH-Eval.jpg",     uptime: "92%", url: "https://web-production-fbd5f.up.railway.app/" },
  { name: "FoodieDB",        tint: "peach",  emoji: "🍜", mascot: "/mascots/HH-lifecycle.jpg",uptime: "99%", url: "https://web-production-fbd5f.up.railway.app/api/status" },
  { name: "Context Report",  tint: "sky",    emoji: "🗂️", mascot: "/mascots/HH-OPS.jpg",      uptime: "94%", url: "https://web-production-19efe.up.railway.app/" },
  { name: "Signal Radar",    tint: "purple", emoji: "📡", mascot: "/mascots/HH-watch.jpg",    uptime: "95%", url: "https://worker-production-c3a3.up.railway.app/cron/status" },
  { name: "HayHay Pulse",    tint: "pink",   emoji: "💓", mascot: "/mascots/HH-lifecycle.jpg",uptime: "99%", url: "https://al-jada-watch-production.up.railway.app/" },
];

interface Props { snap: Snapshot }

export function AgentsGrid({ snap }: Props) {
  const total = snap.kpis.agents_live.total;
  const live = snap.kpis.agents_live.value;

  return (
    <div className="agents-card">
      <div className="agents-head">
        <div className="agents-title">✨ AGENTS IA — 8 ACTIFS</div>
      </div>
      <div className="agents-grid">
        {AGENTS.slice(0, total || 8).map((a, i) => (
          <a
            className="agent-cell"
            key={a.name}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${i * 0.17}s`, textDecoration: "none", cursor: "pointer" }}
          >
            <div className={`agent-avatar tint-${a.tint}`}>
              <img src={a.mascot} alt={a.name} />
              <div className="agent-emoji-pill">{a.emoji}</div>
            </div>
            <div className="agent-name">{a.name}</div>
            <div className="agent-status">
              <div className="agent-dot" />
              En ligne
            </div>
            <div className="agent-uptime">— {a.uptime}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
