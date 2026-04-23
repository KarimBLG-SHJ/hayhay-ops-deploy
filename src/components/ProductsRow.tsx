import type { LifecycleItem, Snapshot } from "../types";

const IMG_BASE = "https://web-production-d97f8.up.railway.app/images/";

function productImg(name: string): string {
  return `${IMG_BASE}${encodeURIComponent(name)}.jpg`;
}

function ProductList({
  title,
  icon,
  items,
  positive,
}: {
  title: string;
  icon: string;
  items: LifecycleItem[];
  positive: boolean;
}) {
  return (
    <div className="product-list-card">
      <div className="product-list-head">
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div className="product-list-title">{title}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item) => (
          <div className="product-row" key={item.name}>
            <img
              className="product-thumb"
              src={productImg(item.name)}
              alt={item.name}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            />
            <div>
              <div className="product-name">{item.name}</div>
              <div className="product-category">
                {item.stage === "launch" ? "Nouveau" : item.stage === "decline" ? "En déclin" : "Croissance"}
              </div>
            </div>
            <div className={`product-delta ${positive ? "pos" : "neg"}`}>
              {positive ? "+" : ""}{item.delta}%
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ padding: '12px 0', color: 'var(--muted)', fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }}>
            Données en cours…
          </div>
        )}
      </div>
    </div>
  );
}

function StarCard({ item, items }: { item: LifecycleItem; items: LifecycleItem[] }) {
  return (
    <div className="star-card">
      <div className="star-pills">
        <span className="star-pill dark">★ BEST SELLER</span>
        <span className="star-pill rose">🔥 +{item.delta}%</span>
      </div>
      <img
        src={productImg(item.name)}
        alt={item.name}
        className="star-photo"
        style={{ objectFit: 'cover' }}
        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
      />
      <div>
        <div className="star-name">{item.name}</div>
        <div className="star-delta">
          +{item.delta}%
          <small>vs hier</small>
        </div>
      </div>
      <div className="star-stats">
        <div className="star-stat">
          <div className="v">{item.spark.reduce((s, v) => s + v, 0)}</div>
          <div className="k">Unités</div>
        </div>
        <div className="star-stat">
          <div className="v">—</div>
          <div className="k">Prix moy.</div>
        </div>
        <div className="star-stat">
          <div className="v">—</div>
          <div className="k">Marge</div>
        </div>
      </div>
      {items.length > 1 && (
        <div className="star-podium">
          <div className="podium-head">Podium du jour</div>
          {items.slice(1, 3).map((p, i) => (
            <div className="podium-row" key={p.name}>
              <div className={`podium-rank ${i === 0 ? "silver" : "bronze"}`}>
                {i === 0 ? "2e" : "3e"}
              </div>
              <img
                className="podium-thumb"
                src={productImg(p.name)}
                alt={p.name}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
              <div className="podium-name">{p.name}</div>
              <div className="podium-delta">+{p.delta}%</div>
            </div>
          ))}
        </div>
      )}
      <div className="star-hint">
        ✨ HayHay suggère : <b>+{Math.round(item.delta * 0.1)} unités</b> demain matin
      </div>
    </div>
  );
}

interface Props { snap: Snapshot }

export function ProductsRow({ snap }: Props) {
  const growth = snap.lifecycle_growth;
  const decline = snap.lifecycle_decline;
  const star = growth[0];

  return (
    <div className="products-row">
      <ProductList title="Top Produits" icon="🔥" items={growth} positive />
      <ProductList title="En Déclin" icon="📉" items={decline} positive={false} />
      {star ? (
        <StarCard item={star} items={growth} />
      ) : (
        <div className="star-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'Nunito', fontWeight: 700 }}>Données en cours…</div>
        </div>
      )}
    </div>
  );
}
