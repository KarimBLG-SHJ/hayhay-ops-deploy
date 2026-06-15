import { useEffect, useState } from "react";
import { DEFAULT_ROUTE, findItem } from "./nav";

/** Tiny hash router — no dependency. Route = the part after `#/`. */
function parseHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  const id = raw || DEFAULT_ROUTE;
  const item = findItem(id);
  // Unknown ids fall back to default; external items ARE valid routes
  // (rendered as an embedded frame to keep the user inside the shell).
  if (!item) return DEFAULT_ROUTE;
  return id;
}

export function useHashRoute(): [string, (id: string) => void] {
  const [route, setRoute] = useState<string>(parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = (id: string) => {
    window.location.hash = `#/${id}`;
  };

  return [route, navigate];
}
