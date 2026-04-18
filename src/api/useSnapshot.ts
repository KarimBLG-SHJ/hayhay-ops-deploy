import { useEffect, useState } from "react";
import type { Snapshot } from "../types";
import { SNAPSHOT_MOCK } from "../mocks/snapshot.mock";
import { USE_MOCK } from "./client";
import { buildLiveSnapshot } from "./adapters";

async function fetchSnapshot(): Promise<Snapshot> {
  if (USE_MOCK) return SNAPSHOT_MOCK;
  return buildLiveSnapshot();
}

export function useSnapshot(pollMs: number = 60_000): Snapshot {
  const [snap, setSnap] = useState<Snapshot>(SNAPSHOT_MOCK);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const s = await fetchSnapshot();
        if (!cancelled) setSnap(s);
      } catch (e) {
        console.warn("snapshot error", e);
      }
    };
    run();
    const i = window.setInterval(run, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [pollMs]);
  return snap;
}
