export const API_ENDPOINTS = {
  coach: import.meta.env.VITE_COACH_URL ?? "https://worker-production-c3a3.up.railway.app",
  dashboard: import.meta.env.VITE_DASHBOARD_URL ?? "https://web-production-fbd5f.up.railway.app",
  contextos: import.meta.env.VITE_CONTEXTOS_URL ?? "https://web-production-19efe.up.railway.app",
  hub: import.meta.env.VITE_HUB_URL ?? "https://hayhay-hub-production.up.railway.app",
};

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}
