import { useEffect, useState } from "react";

/** Quote-aware CSV parser — fields may contain commas (decimal separators). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Parse a number that may use comma OR dot decimals, %, and thousands spaces. */
export function num(s: string | undefined): number {
  if (!s) return NaN;
  let v = s.replace(/%/g, "").replace(/\s/g, "").trim();
  if (v.includes(".") && v.includes(",")) v = v.replace(/,/g, ""); // comma = thousands
  else if (/^-?\d+,\d+$/.test(v)) v = v.replace(",", ".");          // comma = decimal
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

export interface SheetState {
  loading: boolean;
  error: string | null;
  header: string[];
  rows: Record<string, string>[];
}

/** Fetch a CSV endpoint and return objects keyed by header. */
export function useSheet(path: string): SheetState {
  const [state, setState] = useState<SheetState>({ loading: true, error: null, header: [], rows: [] });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`${path} → ${res.status}`);
        const text = await res.text();
        const table = parseCsv(text);
        if (!table.length) throw new Error("vide");
        const header = table[0].map((h) => h.trim());
        const rows = table.slice(1).map((r) => {
          const o: Record<string, string> = {};
          header.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
          return o;
        });
        if (!cancelled) setState({ loading: false, error: null, header, rows });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: String(e), header: [], rows: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [path]);
  return state;
}
