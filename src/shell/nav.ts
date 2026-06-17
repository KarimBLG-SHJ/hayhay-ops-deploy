/**
 * Navigation registry for the HayHay OS shell.
 *
 * - `module` items are internal routes rendered inside the shell (#/<id>).
 * - `external` items deep-link to a standalone HayHay app in a new tab —
 *   we keep those backends untouched; the shell is just the front door.
 *
 * Phase 1: cockpit is the only fully-wired view (the existing Command Deck).
 * The other modules are scaffolded placeholders, migrated one by one in Phase 2.
 */
export type NavKind = "module" | "external";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  kind: NavKind;
  badge?: string | null;
  href?: string; // external only
  ready?: boolean; // module: true once its native view is wired
  embed?: boolean; // external: false = can't be iframed (auth/Next.js) → show launch card
}

export interface NavGroup {
  title: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [
      { id: "cockpit", label: "Cockpit", icon: "⬡", kind: "module", ready: true },
    ],
  },
  {
    title: "Quotidien",
    items: [
      { id: "sales", label: "Ventes", icon: "📈", kind: "module", ready: true },
      { id: "cogs", label: "COGS & marges", icon: "💰", kind: "module", ready: true },
      { id: "talabat", label: "Talabat", icon: "🛵", kind: "module", ready: true, badge: null },
      { id: "stock", label: "Stock & waste", icon: "📦", kind: "module", ready: true },
      { id: "lifecycle", label: "Cycle de vie", icon: "🔄", kind: "module", ready: true },
    ],
  },
  {
    title: "Externe",
    items: [
      { id: "context", label: "Context", icon: "☁️", kind: "module", ready: true },
      {
        id: "reports",
        label: "Rapports",
        icon: "📋",
        kind: "external",
        href: "https://hayhay-reports-production.up.railway.app",
      },
      {
        id: "hub",
        label: "Hub & SOP",
        icon: "📘",
        kind: "external",
        href: "https://hayhay-hub-production.up.railway.app",
      },
      {
        id: "b2b",
        label: "Site B2B",
        icon: "🌐",
        kind: "external",
        href: "https://web-production-d97f8.up.railway.app",
      },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function findItem(id: string): NavItem | undefined {
  return ALL_ITEMS.find((i) => i.id === id);
}

export const DEFAULT_ROUTE = "cockpit";
