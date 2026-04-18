/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COACH_URL?: string;
  readonly VITE_DASHBOARD_URL?: string;
  readonly VITE_CONTEXTOS_URL?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    burst?: (x: number, y: number, color?: string, count?: number) => void;
  }
}

export {};
