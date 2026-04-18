import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0d0f",
        "bg-2": "#0d1114",
        tile: "#11161a",
        "tile-2": "#161c22",
        border: "#1e2830",
        "border-2": "#2a3642",
        text: "#d4dae0",
        dim: "#7a8590",
        mute: "#4e5864",
        gold: "#e8c547",
        "gold-soft": "#c9a937",
        cyan: "#4dd9e6",
        green: "#7ee787",
        "green-hi": "#00FF88",
        red: "#ff6b6b",
        amber: "#ffb545",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
