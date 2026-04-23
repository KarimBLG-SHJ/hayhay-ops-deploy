import type { Snapshot } from "../types";

const AGENTS = [
  { name: "Client Briefing", tint: "purple", emoji: "📋", mascot: "/mascots/HH-OPS.jpg",      uptime: "98%" },
  { name: "Dose Accuracy",   tint: "mint",   emoji: "🎯", mascot: "/mascots/HH-Eval.jpg",     uptime: "96%" },
  { name: "Supervision",     tint: "pink",   emoji: "👀", mascot: "/mascots/HH-watch.jpg",    uptime: "99%" },
  { name: "Résultats",       tint: "yellow", emoji: "📊", mascot: "/mascots/HH-Eval.jpg",     uptime: "92%" },
  { name: "FoodieDB",        tint: "peach",  emoji: "🍜", mascot: "/mascots/HH-lifecycle.jpg",uptime: "99%" },
  { name: "Context Report",  tint: "sky",    emoji: "🗂️", mascot: "/mascots/HH-OPS.jpg",      uptime: "94%" },
  { name: "Signal Radar",    tint: "purple", emoji: "📡", mascot: "/mascots/HH-watch.jpg",    uptime: "95%" },
  { name: "HayHay Pulse",    tint: "pink",   emoji: "💓", mascot: "/mascots/HH-lifecycle.jpg",uptime: "99%" },
];

interface Props { snap: Snapshot }

export function AgentsGrid({ snap }: Props) {
  const total = snap.kpis.agents_live.total;
  const live = snap.kpis.agents_live.value;

  return (
    <div className="agents-card">
      <div className="agents-head">
        <div className="agents-title">✨ AGENTS IA — {live} ACTIFS</div>
        <a className="agents-link">VOIR TOUS →</a>
      </div>
      <div className="agents-grid">
        {AGENTS.slice(0, total || 8).map((a, i) => (
          <div className="agent-cell" key={a.name} style={{ animationDelay: `${i * 0.17}s` }}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
