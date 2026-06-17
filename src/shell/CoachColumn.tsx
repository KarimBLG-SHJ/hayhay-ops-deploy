import { useEffect, useState } from "react";

/**
 * Persistent Coach IA column — the superapp's conversational layer.
 * The coach already has the brain + every tool; we embed its chat UI
 * same-origin through the proxy (/api/coach/* → coach service).
 *
 * Unlike the old FAB dock, this is a real grid column (pushes content, never
 * overlays it) that stays open across navigation. The iframe is mounted once
 * and only hidden when collapsed, so the conversation survives route changes
 * and collapse/expand. Open/closed is remembered in localStorage.
 */
const COACH_CHAT_URL = "/api/coach/chat-ui";
const LS_KEY = "coach-col-open";

export function useCoachOpen() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, open ? "1" : "0"); } catch { /* ignore */ }
  }, [open]);
  return [open, setOpen] as const;
}

export function CoachColumn({ open, onToggle }: { open: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className={`coach-col ${open ? "open" : "closed"}`}>
      {open && (
        <div className="coach-col-head">
          <div className="coach-col-title"><span>✨</span> Coach IA</div>
          <div className="coach-col-actions">
            <a href={COACH_CHAT_URL} target="_blank" rel="noopener noreferrer"
               className="coach-col-btn" title="Ouvrir en plein écran">↗</a>
            <button className="coach-col-btn" onClick={() => onToggle(false)}
                    aria-label="Replier" title="Replier">⟩</button>
          </div>
        </div>
      )}

      {/* Always mounted → conversation persists. Hidden (not unmounted) when collapsed. */}
      <div className="coach-col-frame-wrap" style={{ display: open ? "flex" : "none" }}>
        <iframe className="coach-col-frame" src={COACH_CHAT_URL} title="Coach IA" />
      </div>

      {!open && (
        <button className="coach-fab" onClick={() => onToggle(true)} aria-label="Ouvrir Coach IA">
          <span className="coach-fab-icon">✨</span>
          Coach IA
        </button>
      )}
    </div>
  );
}
