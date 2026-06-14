import { useState } from "react";

/**
 * Persistent Coach IA dock — the differentiator of the superapp.
 * The coach already has the brain + every tool; we embed its chat UI
 * same-origin through the proxy (/api/coach/* → coach service).
 *
 * Phase 1: embed the existing chat-ui in a slide-over panel. If the coach
 * disallows framing, the header link opens it full-page in a new tab.
 */
const COACH_CHAT_URL = "/api/coach/chat-ui";

export function CoachDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          className="coach-fab"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir Coach IA"
        >
          <span className="coach-fab-icon">✨</span>
          Coach IA
        </button>
      )}

      {open && (
        <div className="coach-dock">
          <div className="coach-dock-head">
            <div className="coach-dock-title">
              <span>✨</span> Coach IA
            </div>
            <div className="coach-dock-actions">
              <a
                href={COACH_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="coach-dock-link"
                title="Ouvrir en plein écran"
              >
                ↗
              </a>
              <button
                className="coach-dock-close"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe
            className="coach-dock-frame"
            src={COACH_CHAT_URL}
            title="Coach IA"
          />
        </div>
      )}
    </>
  );
}
