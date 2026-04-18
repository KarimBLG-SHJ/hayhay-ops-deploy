import { useEffect } from "react";
import { useSnapshot } from "./api/useSnapshot";
import { TopBar } from "./components/TopBar";
import { LeftRail } from "./components/LeftRail";
import { Hero } from "./components/Hero";
import { RightRail } from "./components/RightRail";
import { Ticker } from "./components/Ticker";
import { ParticleLayer } from "./components/Arcade";

export default function App() {
  const snap = useSnapshot(60_000);

  useEffect(() => {
    const tiles = document.querySelectorAll<HTMLElement>(".app .tile:not(.hero)");
    const cleanups: Array<() => void> = [];
    tiles.forEach((el) => {
      let rafId = 0;
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * 6;
        const ry = (px - 0.5) * 6;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.01)`;
          el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(rafId);
        el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) scale(1)";
      };
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [snap]);

  return (
    <>
      <ParticleLayer />
      <div className="app">
        <TopBar kpis={snap.kpis} />
        <LeftRail snap={snap} />
        <Hero snap={snap} />
        <RightRail snap={snap} />
        <Ticker items={snap.ticker} />
      </div>
    </>
  );
}
