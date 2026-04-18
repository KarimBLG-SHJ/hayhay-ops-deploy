import { useEffect } from "react";
import type { StreamEvent } from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import { USE_MOCK } from "./client";

/**
 * In live mode this is a no-op — the 60s useSnapshot poll refreshes signal_radar
 * from /slack/recent. When SSE `/api/stream` lands on coach, wire it here.
 * In mock mode, emit synthetic signal events every 4.2s for animation.
 */
export function useStream(onEvent: (e: StreamEvent) => void): void {
  useEffect(() => {
    if (!USE_MOCK) return;
    const pool = SNAPSHOT_MOCK.signal_pool;
    const i = window.setInterval(() => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      onEvent({ type: "signal", payload: { ...p, ts: Date.now() } });
    }, 4200);
    return () => window.clearInterval(i);
  }, [onEvent]);
}
