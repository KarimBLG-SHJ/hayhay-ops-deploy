import type { Snapshot } from "../types";

// Little VIP silhouette — 6 color variants, rotates by row index.
function VipAvatar({ variant = 0 }: { variant?: number }) {
  const palettes = [
    { skin: "#FFD6B8", hair: "#3A2718", shirt: "#F9A8B4", acc: "#FFD66B" },
    { skin: "#F5C79A", hair: "#5B2E1A", shirt: "#7DD3A8", acc: "#FFFFFF" },
    { skin: "#E8B88F", hair: "#1F1F1A", shirt: "#B794F4", acc: "#F9A8B4" },
    { skin: "#FFDEC0", hair: "#8B4513", shirt: "#FFD66B", acc: "#F9A8B4" },
    { skin: "#F0C4A0", hair: "#2A1810", shirt: "#FF9B5A", acc: "#7DD3A8" },
    { skin: "#FFD6B8", hair: "#4A2E1F", shirt: "#8BD3E6", acc: "#FFD66B" },
  ];
  const p = palettes[variant % palettes.length];
  const isHijab = variant === 2;
  const isBeanie = variant === 4;
  return (
    <div className="vip-avatar" style={{ background: 'transparent', padding: 0 }}>
      <svg viewBox="0 0 40 40" width="34" height="34">
        <ellipse cx="20" cy="37" rx="10" ry="1.5" fill="rgba(0,0,0,0.08)" />
        <path d="M 6 40 Q 6 28 20 26 Q 34 28 34 40 Z" fill={p.shirt} />
        <path d="M 14 30 Q 20 33 26 30" stroke={p.acc} strokeWidth="1.2" fill="none" opacity="0.5" />
        {isHijab ? (
          <path d="M 7 22 Q 7 8 20 7 Q 33 8 33 22 L 33 30 Q 33 32 30 32 L 10 32 Q 7 32 7 30 Z" fill={p.hair} />
        ) : (
          <path d="M 9 20 Q 8 9 20 8 Q 32 9 31 20 L 31 24 L 9 24 Z" fill={p.hair} />
        )}
        <circle cx="20" cy="20" r="10" fill={p.skin} />
        {!isHijab && (
          <path d="M 10 17 Q 13 10 20 10 Q 27 10 30 17 Q 28 14 24 14 Q 22 17 20 15 Q 18 17 16 14 Q 12 14 10 17 Z" fill={p.hair} />
        )}
        {isBeanie && (
          <g>
            <path d="M 9 16 Q 9 7 20 7 Q 31 7 31 16 Z" fill={p.acc} />
            <rect x="9" y="15" width="22" height="3" rx="1" fill={p.hair} opacity="0.25" />
            <circle cx="20" cy="5" r="2" fill={p.hair} />
          </g>
        )}
        <path d="M 15 21 q 1.5 1.5 3 0" stroke="#2A1810" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 22 21 q 1.5 1.5 3 0" stroke="#2A1810" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="23" r="1.2" fill="#F9A8B4" opacity="0.6" />
        <circle cx="26" cy="23" r="1.2" fill="#F9A8B4" opacity="0.6" />
        <path d="M 18 25 q 2 1.5 4 0" stroke="#2A1810" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

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
  const { day_split_pct, top_vips, vips_at_risk, channel_mix, kpis, perf_scores } = snap;

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
  const cuisine = perf_scores?.cuisine ?? 0;
  const clients = perf_scores?.clients ?? 0;
  const stocks = perf_scores?.stocks ?? 0;
  const perfBars = [
    { k: "Agents IA",    v: uptime },   // uptime crons /cron/status
    { k: "Cuisine",      v: cuisine },  // avg sell_through_pct batch
    { k: "Clients",      v: clients },  // CA today / target 2500 AED
    { k: "Stocks",       v: stocks },   // 100 - waste_rate batch
  ];
  // Global ring = moyenne des 4 signaux
  const globalScore = Math.round((uptime + cuisine + clients + stocks) / 4);
  const ringCirc = 2 * Math.PI * 30;
  const ringPct = globalScore / 100;

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
              <VipAvatar variant={i} />
              <div className="vip-info">
                <div className="vip-name" title={v.name || v.initials}>{v.name || v.initials}</div>
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

      {/* VIP à risque — clients fidèles silencieux */}
      {vips_at_risk && vips_at_risk.length > 0 && (
        <div className="rail-card">
          <div className="rail-title" style={{ color: 'var(--pink-dk)' }}>⚠️ VIP qu'on perd</div>
          <div style={{ fontSize: 10, fontFamily: 'Nunito', fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
            Clients fidèles silencieux depuis {'>'}10j
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {vips_at_risk.slice(0, 5).map((v, i) => (
              <div className="vip-row" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <VipAvatar variant={(i + 3) % 6} />
                <div className="vip-info">
                  <div className="vip-name" title={v.name}>{v.name}</div>
                  <div className="vip-id">{v.lifetime} cmd · silence {v.days_silent}j</div>
                </div>
                <div className="vip-right">
                  <div className="vip-amt">{v.amt_45d} AED</div>
                  <div className="vip-tag" style={{ background: '#FFE4EA', color: 'var(--pink-dk)' }}>RISQUE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div className="perf-ring-val">{globalScore}</div>
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
