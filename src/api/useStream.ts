import { useEffect } from "react";
import type { StreamEvent } from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import { COACH, USE_MOCK } from "./client";

export function useStream(onEvent: (e: StreamEvent) => void): void {
  useEffect(() => {
    if (USE_MOCK) {
      const pool = SNAPSHOT_MOCK.signal_pool;
      const i = window.setInterval(() => {
        const p = pool[Math.floor(Math.random() * pool.length)];
        onEvent({ type: "signal", payload: { ...p, ts: Date.now() } });
      }, 4200);
      return () => window.clearInterval(i);
    }
    // When /api/coach/api/stream is implemented, wire here.
    // For now, even in live mode, simulate from the pool until SSE is ready.
    const pool = SNAPSHOT_MOCK.signal_pool;
    const i = window.setInterval(() => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      onEvent({ type: "signal", payload: { ...p, ts: Date.now() } });
    }, 4200);
    return () => window.clearInterval(i);
  }, [onEvent]);
}
