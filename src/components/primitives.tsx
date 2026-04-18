import { useEffect, useRef, useState, type ReactNode } from "react";

export function smoothStop(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - t, 3.2);
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function useCountUp(target: number, duration: number = 400): number {
  const [val, setVal] = useState<number>(target);
  const fromRef = useRef<number>(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    if (target === prevTargetRef.current) return;
    fromRef.current = val;
    startRef.current = performance.now();
    prevTargetRef.current = target;
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const e = smoothStop(t);
      setVal(fromRef.current + (target - fromRef.current) * e);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setVal(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return val;
}

interface CountNumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

export function CountNumber({ value, format = (v) => v.toFixed(0), className = "" }: CountNumberProps) {
  const v = useCountUp(value, 400);
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const i = window.setInterval(() => {
      if (Math.random() < 0.25) {
        setGlitch(true);
        window.setTimeout(() => setGlitch(false), 140);
      }
    }, 15000 + Math.random() * 8000);
    return () => window.clearInterval(i);
  }, []);
  return <span className={className + (glitch ? " glitch" : "")}>{format(v)}</span>;
}

interface LiveDotProps {
  phase?: number;
}

export function LiveDot({ phase = 0 }: LiveDotProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.animationDelay = `${phase}s`;
  }, [phase]);
  return <span ref={ref} className="live-dot" />;
}

interface TileHeadProps {
  title: ReactNode;
  meta?: ReactNode;
  live?: boolean;
  /** One-line sub-title shown under the title. Plain English, explains WHAT is tracked and over WHICH period. */
  sub?: ReactNode;
}

export function TileHead({ title, meta, live, sub }: TileHeadProps) {
  return (
    <div className="tile-head">
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="tick" />
          <span className="title">{title}</span>
        </div>
        {sub && <span className="tile-sub">{sub}</span>}
      </div>
      {live ? (
        <span className="meta live">
          <LiveDot phase={Math.random() * -2} /> LIVE
        </span>
      ) : meta ? (
        <span className="meta">{meta}</span>
      ) : null}
    </div>
  );
}

/**
 * Opens a URL in a new browser tab. Used by every clickable tile/row in the dashboard
 * to send the operator to the underlying tool (Foodics, HayHay Dashboard, Slack, ContextOS).
 * Falls back to a toast if the URL looks like an internal route (leading "/") — those
 * sub-routes are not implemented yet.
 */
export function openUrl(url: string): void {
  if (!url) return;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("slack://")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  // Internal placeholder route — show toast
  toast("→ " + url);
}

function toast(text: string) {
  const el = document.createElement("div");
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    top: "64px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(10,13,15,0.95)",
    border: "1px solid rgba(232,197,71,0.45)",
    color: "#e8c547",
    padding: "8px 16px",
    borderRadius: "6px",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "11px",
    letterSpacing: "0.08em",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    opacity: "0",
    transition: "opacity 180ms ease-out, transform 180ms ease-out",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(4px)";
  });
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }, 1100);
}

// ---- External tool URLs ----
export const LINKS = {
  hayhayDashboard: "https://web-production-fbd5f.up.railway.app",
  contextOsDashboard: "https://web-production-19efe.up.railway.app/dashboard",
  coachStatus: "https://worker-production-c3a3.up.railway.app/cron/status",
  foodicsConsole: "https://console.foodics.com",
  slackWorkspace: "https://app.slack.com/client/T08R2L4PC7U",
  slackChannel: (name: string) => `https://karimos.slack.com/channels/${name.replace(/^#/, "")}`,
  hayhayHub: "https://hayhay-hub-production.up.railway.app",
};

/** Legacy alias kept for components that still call goto(). Prefer openUrl directly. */
export const goto = openUrl;
