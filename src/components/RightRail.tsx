import type { Snapshot } from "../types";

function DonutChart({ slices }: { slices: { k: string; pct: number; color: string }[] }) {
  const r = 35;
  const cx = 45;
  const cy = 45;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  const arcs = slices.map((s) => {
    const offset = circumference - (s.pct / 100) * circumference;
    const rotate = (cumulative / 100) * 360 - 90;
    cumulative += s.pct;
    return { ...s, offset, rotate };
  });

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      {arcs.map((arc) => (
        <circle
          key={arc.k}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="14"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={arc.offset}
          transform={`rotate(${arc.rotate} ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      ))}
    </svg>
  );
}

interface Props { snap: Snapshot }

export function RightRail({ snap }: Props) {
  const { day_split_pct, top_vips, channel_mix, kpis } = snap;

  const amPct = day_split_pct ?? 60;
  const pmPct = 100 - amPct;

  const mixSlices = [
    { k: "POS",     pct: Math.round((channel_mix.POS ?? 0) * 100),     color: "#7DD3A8" },
    { k: "TALABAT", pct: Math.round((channel_mix.Talabat ?? 0) * 100), color: "#F9A8B4" },
    { k: "SHOP",    pct: Math.round((channel_mix.Shop ?? 0) * 100),    color: "#FFD66B" },
    { k: "KEETA",   pct: Math.round((channel_mix.Keeta ?? 0) * 100),   color: "#B794F4" },
  ].filter((s) => s.pct > 0);

  const posPct = mixSlices.find((s) => s.k === "POS")?.pct ?? 0;

  const uptime = kpis.agents_live.uptime_pct;
  const perfBars = [
    { k: "Agents IA",    v: uptime },
    { k: "Cuisine",      v: 82 },
    { k: "Clients",      v: 67 },
    { k: "Stocks",       v: 74 },
  ];
  const ringCirc = 2 * Math.PI * 30;
  const ringPct = uptime / 100;

  return (
    <aside className="right-col">
      {/* CA Split */}
      <div className="rail-card">
        <div className="rail-title">CA Split</div>
        <div className="split-bar">
          <div className="am" style={{ width: `${amPct}%` }} />
          <div className="pm" style={{ width: `${pmPct}%` }} />
        </div>
        <div className="split-labels">
          <div className="split-label" style={{ color: 'var(--mint-dk)' }}>
            {amPct}%
            <small>Matin · 06–12h</small>
          </div>
          <div className="split-label" style={{ color: 'var(--pink-dk)', textAlign: 'right' }}>
            {pmPct}%
            <small>Après-midi · 12–20h</small>
          </div>
        </div>
      </div>

      {/* Top VIP */}
      <div className="rail-card">
        <div className="rail-title">Top VIP — Aujourd'hui</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {top_vips.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }}>
              Données en cours…
            </div>
          )}
          {top_vips.map((v, i) => (
            <div className="vip-row" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="vip-avatar">{v.initials}</div>
              <div className="vip-info">
                <div className="vip-name">{v.name || v.initials}</div>
                <div className="vip-id">{v.visits}× visite{v.visits > 1 ? "s" : ""}</div>
              </div>
              <div className="vip-right">
                <div className="vip-amt">{v.amt} AED</div>
                <div className={`vip-tag ${v.tag.toLowerCase()}`}>{v.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mix de ventes */}
      <div className="rail-card">
        <div className="rail-title">Mix de ventes</div>
        <div className="donut-wrap">
          <div className="donut-svg-wrap">
            <DonutChart slices={mixSlices} />
            <div className="donut-center-text">
              <div className="donut-center-val">{posPct}%</div>
              <div className="donut-center-lab">POS</div>
            </div>
          </div>
          <div className="mix-legend">
            {mixSlices.map((s) => (
              <div className="mix-row" key={s.k}>
                <div className="mix-dot" style={{ background: s.color }} />
                <div className="mix-name">{s.k}</div>
                <div className="mix-pct">{s.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HayHay Assistant */}
      <div className="chat-card">
        <div className="chat-header">
          <div className="chat-bot-avatar">🤖</div>
          <div className="chat-bot-name">HayHay Assistant</div>
        </div>
        <div className="chat-bubble">
          Yo Boss! 👋 Tout roule ce midi. Prévision ce soir : <b>+28% de commandes</b>. Veux-tu que j'active le mode <b>Turbo Cuisine</b> ?
        </div>
        <button className="chat-cta">Activer le mode Turbo →</button>
      </div>

      {/* Performance Globale */}
      <div className="perf-card">
        <div className="rail-title">Performance Globale</div>
        <div className="perf-ring-wrap">
          <div className="perf-ring-svg">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <defs>
                <linearGradient id="perf-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F9A8B4" />
                  <stop offset="100%" stopColor="#B794F4" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="30" fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="40" cy="40" r="30"
                fill="none"
                stroke="url(#perf-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${ringCirc} ${ringCirc}`}
                strokeDashoffset={ringCirc - ringPct * ringCirc}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 800ms ease' }}
              />
            </svg>
            <div className="perf-ring-center">
              <div className="perf-ring-val">{Math.round(uptime)}</div>
              <div className="perf-ring-lab">/100</div>
            </div>
          </div>
          <div className="perf-bars">
            {perfBars.map((b) => (
              <div className="perf-bar-row" key={b.k}>
                <div className="perf-bar-label">
                  <span>{b.k}</span>
                  <span>{Math.round(b.v)}%</span>
                </div>
                <div className="perf-bar-track">
                  <div className="perf-bar-fill" style={{ width: `${b.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
