import type { LifecycleItem, Snapshot } from "../types";

const IMG_BASE = "https://web-production-d97f8.up.railway.app/images/";

// Foodics names → exact image filenames (B2B catalog)
const CATALOG_MAP: Record<string, string> = {
  "croissant": "CROISSANT",
  "pain au chocolat": "PAIN 4 CHOCOLAT",
  "pain 4 chocolat": "PAIN 4 CHOCOLAT",
  "apple turnover": "APPLE TURNOVER",
  "almond croissant": "ALMOND CROISSANT",
  "chocolate chip cramique": "CHOCOLATE CRAMIQUE",
  "chocolate cramique": "CHOCOLATE CRAMIQUE",
  "chocolate twist": "Chocolate Twist",
  "pain suisse": "PAIN SUISSE",
  "viennese bread choc chips": "VIENNA CHOCO BREAD",
  "vienna choco bread": "VIENNA CHOCO BREAD",
  "viennese bread classic": "VIENNA BREAD",
  "vienna bread": "VIENNA BREAD",
  "cookie daily rotation": "Cookie - Daily Rotation",
  "cookie - daily rotation": "Cookie - Daily Rotation",
  "baguette": "BAGUETTE TRADITION",
  "baguette tradition": "BAGUETTE TRADITION",
  "baguette tradition small": "BAGUETTE TRADITION SMALL",
  "brioche loaf": "BRIOCHE",
  "brioche": "BRIOCHE",
  "country white loaf": "COUNTRY",
  "country": "COUNTRY",
  "danish rye bread": "DANISH RYE PROTEIN",
  "danish rye protein": "DANISH RYE PROTEIN",
  "tartine bread": "TARTINE BREAD",
  "rye bread": "RYE",
  "rye": "RYE",
  "apricot nuts bread": "APRICOT & ALMOND",
  "apricot almond": "APRICOT & ALMOND",
  "mexican bread": "Mexican Bread",
  "arabic bread": "KHOBZ MATLOU",
  "khobz matlou": "KHOBZ MATLOU",
  "daba bread": "DABA BREAD",
  "focaccia tray": "FOCACCIA",
  "focaccia": "FOCACCIA",
  "english muffin": "English Muffin",
};

const THUMB_COLORS = [
  "linear-gradient(135deg, #FFE4EA 0%, #FFBFCF 100%)",
  "linear-gradient(135deg, #D9F4E6 0%, #A8E6C8 100%)",
  "linear-gradient(135deg, #FFF4C9 0%, #FFDE85 100%)",
  "linear-gradient(135deg, #E9E0FF 0%, #CDBFFF 100%)",
  "linear-gradient(135deg, #FFE4D0 0%, #FFC2A0 100%)",
  "linear-gradient(135deg, #E3F0FF 0%, #BFD9FF 100%)",
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function productImgUrl(name: string): string | null {
  const key = norm(name);
  const exact = CATALOG_MAP[key];
  if (exact) return `${IMG_BASE}${encodeURIComponent(exact)}.jpg`;
  // partial match
  for (const [k, v] of Object.entries(CATALOG_MAP)) {
    if (key.includes(k) || k.includes(key)) return `${IMG_BASE}${encodeURIComponent(v)}.jpg`;
  }
  return null;
}

function ProductThumbWithFallback({ name, size = 56, idx = 0, className = "product-thumb" }: {
  name: string; size?: number; idx?: number; className?: string;
}) {
  const url = productImgUrl(name);
  const fallbackBg = THUMB_COLORS[idx % THUMB_COLORS.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {url ? (
        <img
          className={className}
          src={url}
          alt={name}
          style={{ width: size, height: size, position: 'absolute', inset: 0 }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <div
        style={{
          width: size, height: size, borderRadius: 14,
          background: fallbackBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', fontWeight: 800, fontSize: size * 0.36,
          color: 'var(--text-2)',
        }}
      >
        {initial}
      </div>
    </div>
  );
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
        {items.map((item, i) => (
          <div className="product-row" key={item.name}>
            <ProductThumbWithFallback name={item.name} size={56} idx={i} />
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
      <ProductThumbWithFallback name={item.name} size={200} idx={0} className="star-photo" />
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
              <ProductThumbWithFallback name={p.name} size={32} idx={i + 1} className="podium-thumb" />
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
