import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const COACH = process.env.VITE_PROXY_COACH || "https://worker-production-c3a3.up.railway.app";
const DASHBOARD = process.env.VITE_PROXY_DASHBOARD || "https://web-production-fbd5f.up.railway.app";
const CONTEXTOS = process.env.VITE_PROXY_CONTEXTOS || "https://web-production-19efe.up.railway.app";
const ALJADA = process.env.VITE_PROXY_ALJADA || "https://al-jada-watch-production.up.railway.app";

const proxy = {
  "/api/coach": {
    target: COACH,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/coach/, ""),
  },
  "/api/dashboard": {
    target: DASHBOARD,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/dashboard/, ""),
  },
  "/api/contextos": {
    target: CONTEXTOS,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/contextos/, ""),
  },
  "/api/aljada": {
    target: ALJADA,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/aljada/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173, proxy },
  preview: { host: "0.0.0.0", port: Number(process.env.PORT) || 4173, proxy },
});
