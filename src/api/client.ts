/**
 * All API calls are same-origin through the proxy:
 *   /api/coach/*     → worker-production-c3a3.up.railway.app
 *   /api/dashboard/* → web-production-fbd5f.up.railway.app
 *   /api/contextos/* → web-production-19efe.up.railway.app
 *
 * In dev, the proxy is Vite (vite.config.ts).
 * In prod, the proxy is Express (server.js).
 */
export const COACH = "/api/coach";
export const DASHBOARD = "/api/dashboard";
export const CONTEXTOS = "/api/contextos";
export const ALJADA = "/api/aljada";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export function todayUAE(): string {
  const now = new Date();
  const uae = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  return `${uae.getFullYear()}-${String(uae.getMonth() + 1).padStart(2, "0")}-${String(uae.getDate()).padStart(2, "0")}`;
}
