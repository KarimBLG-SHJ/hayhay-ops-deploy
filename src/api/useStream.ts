import { useEffect } from "react";
import type { StreamEvent } from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import { API_ENDPOINTS, USE_MOCK } from "./client";

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
    const es = new EventSource(`${API_ENDPOINTS.coach}/api/stream`);
    es.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data) as StreamEvent);
      } catch {
        /* ignore malformed */
      }
    };
    return () => es.close();
  }, [onEvent]);
}
