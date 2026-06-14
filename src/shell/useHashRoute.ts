import { useEffect, useState } from "react";
import { DEFAULT_ROUTE, findItem } from "./nav";

/** Tiny hash router — no dependency. Route = the part after `#/`. */
function parseHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  const id = raw || DEFAULT_ROUTE;
  const item = findItem(id);
  // External items never become the active route; ignore unknown ids.
  if (!item || item.kind === "external") return DEFAULT_ROUTE;
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
    const item = findItem(id);
    if (item?.kind === "external" && item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.hash = `#/${id}`;
  };

  return [route, navigate];
}
