import { useEffect, useState } from "react";
import { COACH, fetchJson } from "./client";

export interface ReconDayAgg {
  business_day: string;
  products: number;
  sold_qty: number;
  revenue: number;
  received: number;
  wastage_calc_total: number;
  wastage_saisi_total: number;
  wastage_aed_total?: number;
  received_aed_total?: number;
  sold_aed_total?: number;
}

export interface ReconRow {
  canonical_id: string;
  sources_seen: string | null;
  sr_qty: number | null;
  sr_uoms: string | null;
  drive_received: number | null;
  drive_wastage: number | null;
  drive_blg_recon: number | null;
  foodics_qty: number | null;
  foodics_revenue: number | null;
  wastage_calc: number | null;
  delta_saisi_calc: number | null;
  delta_sr_recv: number | null;
  stockout_suspect?: boolean | null;
  wastage_aed?: number | null;
  received_aed?: number | null;
  sold_aed?: number | null;
  raw_sr: string | null;
  raw_drive: string | null;
  raw_foodics: string | null;
}

export interface ReconDay {
  business_day: string;
  rows: ReconRow[];
  meta?: {
    rows_count: number;
    excluded_count: number;
    unknown_count: number;
    unknown_sample: unknown[];
    computed_at: string;
  };
}

export interface ReconState {
  loading: boolean;
  error: string | null;
  days: ReconDayAgg[];      // newest first
  byDay: Record<string, ReconDay>;
}

const EMPTY: ReconState = { loading: true, error: null, days: [], byDay: {} };

export function useReconciliation(daysWindow: number = 7, pollMs: number = 5 * 60_000): ReconState {
  const [state, setState] = useState<ReconState>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const list = await fetchJson<{ days: ReconDayAgg[] }>(
          `${COACH}/api/wastage_reconciliation?days=${daysWindow}`
        );
        const days = (list.days || []).slice(0, daysWindow);
        const dayPayloads = await Promise.all(
          days.map((d) =>
            fetchJson<ReconDay>(`${COACH}/api/wastage_reconciliation/${d.business_day}`).catch(
              () => ({ business_day: d.business_day, rows: [] as ReconRow[] })
            )
          )
        );
        if (cancelled) return;
        const byDay: Record<string, ReconDay> = {};
        dayPayloads.forEach((p) => { byDay[p.business_day] = p; });
        setState({ loading: false, error: null, days, byDay });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: String(e) }));
      }
    };
    run();
    const i = window.setInterval(run, pollMs);
    return () => { cancelled = true; window.clearInterval(i); };
  }, [daysWindow, pollMs]);

  return state;
}
