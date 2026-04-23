import { useRef, useState } from "react";
import type { HeroSnapshot } from "../types";

interface Props { hero: HeroSnapshot }

export function HeroCurve({ hero }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; aed: number } | null>(null);

  const W = 700;
  const H = 200;
  const PAD_L = 38;
  const PAD_R = 12;
  const PAD_T = 10;
  const PAD_B = 32;
  const cw = W - PAD_L - PAD_R;
  const ch = H - PAD_T - PAD_B;

  const { shape, start_hour, end_hour, current_ca, target, now_hour } = hero;
  const totalHours = end_hour - start_hour;

  const toX = (h: number) => PAD_L + ((h - start_hour) / totalHours) * cw;
  const toY = (frac: number) => PAD_T + ch - frac * ch;

  // Split actuals vs forecast at now_hour
  const actuals = shape.filter(([h]) => h <= now_hour);
  const forecast = shape.filter(([h]) => h >= now_hour);

  const pathFrom = (pts: [number, number][]) => {
    if (pts.length < 2) return "";
    return pts.map(([h, v], i) => `${i === 0 ? "M" : "L"}${toX(h).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  };

  const areaPath = (pts: [number, number][]) => {
    if (pts.length < 2) return "";
    const line = pts.map(([h, v], i) => `${i === 0 ? "M" : "L"}${toX(h).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
    const [lh] = pts[pts.length - 1];
    const [fh] = pts[0];
    return `${line} L${toX(lh).toFixed(1)},${(PAD_T + ch).toFixed(1)} L${toX(fh).toFixed(1)},${(PAD_T + ch).toFixed(1)} Z`;
  };

  const actualPath = pathFrom(actuals);
  const forecastPath = forecast.length > 1 ? pathFrom(forecast) : "";
  const actualArea = areaPath(actuals);

  // Target dashed line
  const tyY = toY(1);

  // Current point
  const nowPt = actuals[actuals.length - 1];
  const nowX = nowPt ? toX(nowPt[0]) : 0;
  const nowY = nowPt ? toY(nowPt[1]) : 0;

  // X-axis hours
  const hourLabels: number[] = [];
  for (let h = start_hour; h <= end_hour; h += 2) hourLabels.push(h);

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width * W;
    const h = start_hour + ((px - PAD_L) / cw) * totalHours;
    if (h < start_hour || h > end_hour) { setTooltip(null); return; }
    // Find nearest shape point
    const sorted = [...shape].sort((a, b) => Math.abs(a[0] - h) - Math.abs(b[0] - h));
    const [nearH, nearV] = sorted[0];
    const aed = Math.round(nearV * target);
    const hLabel = `${String(Math.floor(nearH)).padStart(2, "0")}:${String(Math.round((nearH % 1) * 60)).padStart(2, "0")}`;
    setTooltip({ x: toX(nearH), y: toY(nearV), label: hLabel, aed });
  };

  return (
    <div className="hero-card">
      <div className="hero-head">
        <div>
          <div className="hero-title">CA Aujourd'hui</div>
          <div className="hero-value">
            {current_ca.toLocaleString()}
            <span>AED</span>
          </div>
        </div>
        <div className="hero-target-label">
          <svg width="24" height="2" viewBox="0 0 24 2"><line x1="0" y1="1" x2="24" y2="1" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          Objectif {target.toLocaleString()} AED
        </div>
      </div>
      <div className="hero-svg-wrap" style={{ height: H }}>
        <svg
          ref={svgRef}
          width="100%" height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F9A8B4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFD66B" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E26B80" />
              <stop offset="100%" stopColor="#D4A430" />
            </linearGradient>
          </defs>

          {/* Y grid lines + labels */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_L} y1={toY(t)} x2={W - PAD_R} y2={toY(t)}
                stroke="var(--line)" strokeWidth="1"
              />
              <text x={PAD_L - 5} y={toY(t) + 4} textAnchor="end"
                style={{ font: '600 9px Nunito', fill: 'var(--muted)' }}>
                {Math.round(t * target / 100) * 100 === 0 ? "0" : Math.round(t * target)}
              </text>
            </g>
          ))}

          {/* Target dashed line */}
          <line x1={PAD_L} y1={tyY} x2={W - PAD_R} y2={tyY}
            stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" />

          {/* X-axis ticks */}
          {hourLabels.map((h) => (
            <text key={h} x={toX(h)} y={H - 6} textAnchor="middle"
              style={{ font: '600 9px Nunito', fill: 'var(--muted)' }}>
              {String(h).padStart(2, "0")}h
            </text>
          ))}

          {/* Area fill (actuals) */}
          {actualArea && (
            <path d={actualArea} fill="url(#area-grad)" />
          )}

          {/* Forecast line (dashed) */}
          {forecastPath && (
            <path d={forecastPath} fill="none" stroke="var(--line-2)" strokeWidth="2" strokeDasharray="5 4" />
          )}

          {/* Actual line */}
          {actualPath && (
            <path d={actualPath} fill="none" stroke="url(#line-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Now vertical line */}
          {nowPt && (
            <line x1={nowX} y1={PAD_T} x2={nowX} y2={PAD_T + ch}
              stroke="var(--line-2)" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* Current point dot */}
          {nowPt && (
            <circle cx={nowX} cy={nowY} r="5" fill="var(--pink-dk)" stroke="#fff" strokeWidth="2.5" />
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="hero-tooltip"
            style={{
              left: `${(tooltip.x / W) * 100}%`,
              top: `${(tooltip.y / H) * 100}%`,
            }}
          >
            {tooltip.label} — {tooltip.aed.toLocaleString()} AED
          </div>
        )}
      </div>
    </div>
  );
}
