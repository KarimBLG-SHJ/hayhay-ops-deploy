import type { NavItem } from "./nav";

/**
 * Embeds an external HayHay app inside the shell so the user never leaves.
 * A thin header keeps context + offers a full-screen fallback in case the
 * target refuses framing (X-Frame-Options).
 */
export function ExternalFrame({ item }: { item: NavItem }) {
  const href = item.href || "";

  // Apps that can't be iframed (auth-gated / Next.js refusing cross-site
  // cookies) get an in-shell launch card instead of a blank frame.
  if (item.embed === false) {
    return (
      <main className="main-col ext-main">
        <div className="ext-launch">
          <div className="ext-launch-icon">{item.icon}</div>
          <h1 className="ext-launch-title">{item.label}</h1>
          <p className="ext-launch-desc">
            Cette app nécessite une connexion et ne peut pas s'afficher dans le tableau de bord.
            Ouvre-la en plein écran.
          </p>
          <a className="ext-launch-btn" href={href} target="_blank" rel="noopener noreferrer">
            Ouvrir {item.label} ↗
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="main-col ext-main">
      <div className="ext-bar">
        <div className="ext-bar-title">
          <span className="ext-bar-icon">{item.icon}</span>
          {item.label}
        </div>
        <a
          className="ext-bar-pop"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir en plein écran"
        >
          Plein écran ↗
        </a>
      </div>
      <iframe key={item.id} className="ext-frame" src={href} title={item.label} />
    </main>
  );
}
