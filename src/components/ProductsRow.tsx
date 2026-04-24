import { useState } from "react";
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

// Talabat CDN fallback for items not in the B2B bakery catalog
// (coffee drinks, toasties, camel paw variants, tarts, cookies, etc.)
const TALABAT_MAP: Record<string, string> = {
  "americano": "https://images.deliveryhero.io/image/talabat/MenuItems/9D34BF9161BDDBEE78884ADEFB26B3BB",
  "apple turnover": "https://images.deliveryhero.io/image/talabat/MenuItems/999D4C32FD373FF70B7C1155EE302895",
  "baguette": "https://images.deliveryhero.io/image/talabat/MenuItems/3698D635C9D91D1A8CE22D81B1C61780",
  "baguette tradition": "https://images.deliveryhero.io/image/talabat/MenuItems/804BBB2FECE3945853A0D16F9BC5A4C1",
  "berry misu": "https://images.deliveryhero.io/image/talabat/MenuItems/B39326515957EDB79E45EFCB9DB452F4",
  "burnt basque cheesecake": "https://images.deliveryhero.io/image/talabat/MenuItems/04B8025FD68E8C5EC626584B9888A826",
  "camel paw almond": "https://images.deliveryhero.io/image/talabat/MenuItems/B2FB63A59BC54CD086729C0870228588",
  "camel paw cheddar cheese": "https://images.deliveryhero.io/image/talabat/MenuItems/61D288DDEC3981F07BDEAF7FE3382083",
  "camel paw choco dark": "https://images.deliveryhero.io/image/talabat/MenuItems/E55921C95CF97F860F76E82C8B25DFCD",
  "camel paw choco hazelnut": "https://images.deliveryhero.io/image/talabat/MenuItems/A91513EC472A8D81E1EADDD86FCA14C5",
  "camel paw duo": "https://images.deliveryhero.io/image/talabat/MenuItems/114DCDDCF161176F1E40E28ABFB48D90",
  "camel paw pecan": "https://images.deliveryhero.io/image/talabat/MenuItems/32675199AD4BE8ADDE6007E6D3D859DF",
  "camel paw pistachio": "https://images.deliveryhero.io/image/talabat/MenuItems/1DF9213D06A87EFC2842E75B2CB8BB23",
  "camel paw quattro": "https://images.deliveryhero.io/image/talabat/MenuItems/67AA551636C6B3CF11BEAECE437A1537",
  "camel paw suisse": "https://images.deliveryhero.io/image/talabat/MenuItems/B96B757797308DD9223580A9816EF5FC",
  "camel paw uno": "https://images.deliveryhero.io/image/talabat/MenuItems/7308DC7468820FD8D0C23A69541A68A2",
  "camel paw za atar cheese": "https://images.deliveryhero.io/image/talabat/MenuItems/6D2384CDC572AA0BF421452883439EA7",
  "cappuccino": "https://images.deliveryhero.io/image/talabat/MenuItems/31BBF53B889E42D978F4658A04BB5A16",
  "chicken black garlic toastie": "https://images.deliveryhero.io/image/talabat/MenuItems/82506B45CBEED973CECE39470997FF83",
  "choco caramel tart": "https://images.deliveryhero.io/image/talabat/MenuItems/53E42A7CEAB9911C2438E580CC591C48",
  "choco misu": "https://images.deliveryhero.io/image/talabat/MenuItems/9A24C24C1FE9490DEB793E752B689C7C",
  "chocolate knot": "https://images.deliveryhero.io/image/talabat/MenuItems/400AE71265D0E2594E1AA491EEDCA19F",
  "cinnamon knot": "https://images.deliveryhero.io/image/talabat/MenuItems/13CC23820E37DFADD6C3CFA0009490C8",
  "cinnamon knot box of 4": "https://images.deliveryhero.io/image/talabat/MenuItems/B96B5F76EC5D3063A3C684F21DA3F0FB",
  "classic tiramisu": "https://images.deliveryhero.io/image/talabat/MenuItems/084A2EB70B3E4BA13B436CDD9BD615C4",
  "coffee ganache tart": "https://images.deliveryhero.io/image/talabat/MenuItems/3BDF14C017F8E0AEC3610925902FE1EF",
  "cookie box box of 4": "https://images.deliveryhero.io/image/talabat/MenuItems/40CB2A9C4290F14135852B84BE8FA60E",
  "country": "https://images.deliveryhero.io/image/talabat/MenuItems/5DA3EB9E26EDE97279E0AE5DEA4684C2",
  "cramique": "https://images.deliveryhero.io/image/talabat/MenuItems/A9F6C5AA05653820A55CB14E02E80E42",
  "dark ganache cookie": "https://images.deliveryhero.io/image/talabat/MenuItems/FA5E18C81898070D47AF7E4CA0B4717B",
  "double choco cookie": "https://images.deliveryhero.io/image/talabat/MenuItems/AFD247CD4294F078D4B9B98FAE081758",
  "espresso": "https://images.deliveryhero.io/image/talabat/MenuItems/9F59DDED0A43805524593EF4AE7EFEF6",
  "falafel tahini 2 sliders": "https://images.deliveryhero.io/image/talabat/MenuItems/EB7C720D381C6DD715C5E68F01318E4F",
  "flat white": "https://images.deliveryhero.io/image/talabat/MenuItems/68FBDB6DE9BCA7C2E895A5EA45EFAF15",
  "focaccia": "https://images.deliveryhero.io/image/talabat/MenuItems/820CF16144B968124181B9498EA93461",
  "full flow": "https://images.deliveryhero.io/image/talabat/MenuItems/265CF281C37D9A2916FB58557954290C",
  "grilled halloumi 2 sliders": "https://images.deliveryhero.io/image/talabat/MenuItems/F125888056BFFE1EC9290E0B3D7A004B",
  "hazelnut gianduja cookie": "https://images.deliveryhero.io/image/talabat/MenuItems/7AA2276A2DF9B9B78F43D47B03F2E175",
  "hot chocolate": "https://images.deliveryhero.io/image/talabat/MenuItems/10BB089D6991A5BF804AD5CBC174A2EF",
  "hot chocolate gianduja": "https://images.deliveryhero.io/image/talabat/MenuItems/DB9659E0ECC10C239AC939C5BEF0F0CD",
  "iced americano": "https://images.deliveryhero.io/image/talabat/MenuItems/5C151B11EA90E8E85058264C3148051D",
  "iced hojicha": "https://images.deliveryhero.io/image/talabat/MenuItems/3EBF29CBC6F8D086479756455EB1F097",
  "iced matcha": "https://images.deliveryhero.io/image/talabat/MenuItems/D3623C3F40A93DD61CA72CD56B322F36",
  "iced saffon latte": "https://images.deliveryhero.io/image/talabat/MenuItems/53C328F4B3D1AEFB8901B3F7308E8C15",
  "iced spanish latte": "https://images.deliveryhero.io/image/talabat/MenuItems/8B0113C06C5CA2844CE11404A0317A30",
  "iced v60": "https://images.deliveryhero.io/image/talabat/MenuItems/D84C15F6F3C3604337D19457E6064209",
  "khobz matlou": "https://images.deliveryhero.io/image/talabat/MenuItems/B85F18E62727DCEB02E97342AC43A68B",
  "lemon cream cookie": "https://images.deliveryhero.io/image/talabat/MenuItems/DD1969C8478E144E4237E8A2A4678545",
  "lemon tart": "https://images.deliveryhero.io/image/talabat/MenuItems/1BD5C9C057DE6DC4E6A69055345EAECD",
  "morning at home": "https://images.deliveryhero.io/image/talabat/MenuItems/EA424B9447340E5ABAF76D8315D2249D",
  "pain au chocolat": "https://images.deliveryhero.io/image/talabat/MenuItems/3C2DDA965DBA66402535DEFB2EAEF904",
  "pain au chocolat box of 4": "https://images.deliveryhero.io/image/talabat/MenuItems/76452B39CFAC92CA1FE453A1E36323E4",
  "pear choco turnover": "https://images.deliveryhero.io/image/talabat/MenuItems/815A5A8FE7137AD0710B2ECFD7390AEF",
  "pecan choco tart": "https://images.deliveryhero.io/image/talabat/MenuItems/2081DE1BF5B399980D3DB31E45D13A3C",
  "pistachio baklava cookie": "https://images.deliveryhero.io/image/talabat/MenuItems/D174024B23BDBEE0B20F1A02CEA9C4D6",
  "pistachio raspberry tart": "https://images.deliveryhero.io/image/talabat/MenuItems/A6EA97053427F669BB69B0CEACB272B6",
  "red berries turnover": "https://images.deliveryhero.io/image/talabat/MenuItems/D9F51B4714E0E8AB8AEFA1D17894788B",
  "rye": "https://images.deliveryhero.io/image/talabat/MenuItems/BCF4A9A1C6BDB8CF44BAF7674024D4AE",
  "saffron latte": "https://images.deliveryhero.io/image/talabat/MenuItems/4B31358424DDCF390AFA72CC94D9E58C",
  "salmon harissa toastie": "https://images.deliveryhero.io/image/talabat/MenuItems/7BE0AF4AFB1640C1CD105AC5B4F612F6",
  "shining kick": "https://images.deliveryhero.io/image/talabat/MenuItems/0800B66A91A68C712187AF7609660A57",
  "small baguette tradition": "https://images.deliveryhero.io/image/talabat/MenuItems/7DF117A251A62B630C387BC23F3E3B57",
  "spanish latte": "https://images.deliveryhero.io/image/talabat/MenuItems/35A55458C4553604EE0BA1D515C1FCA0",
  "tartine": "https://images.deliveryhero.io/image/talabat/MenuItems/1E3DD9D6C9A7A64D89E3F465D516972A",
  "trio box of 3": "https://images.deliveryhero.io/image/talabat/MenuItems/BEBA9C5397A36EB7026EA918D904DD79",
  "turnover box box of 3": "https://images.deliveryhero.io/image/talabat/MenuItems/DA9E4028D5D7D1B64EEA4684BC4643E9",
  "v60": "https://images.deliveryhero.io/image/talabat/MenuItems/F4EECE9A66AC694DE27738DF7CD072ED",
  "vanilla flan": "https://images.deliveryhero.io/image/talabat/MenuItems/A3D0FF4353A3ABF7470208ACE794E1D3",
  "vienna": "https://images.deliveryhero.io/image/talabat/MenuItems/9EA890F744899BEE47A010E5796DF638",
  "vienna choco": "https://images.deliveryhero.io/image/talabat/MenuItems/89D525B2055643E580E7940EF21DED3F",
  "zaatar emmental toastie": "https://images.deliveryhero.io/image/talabat/MenuItems/1C1772E343D4B55C8986C668EDEFCAC9",
};

// Foodics → Talabat name aliases (when Foodics uses a slightly different wording)
const TALABAT_ALIASES: Record<string, string> = {
  "classic latte": "cappuccino",
  "latte": "cappuccino",
  "iced matcha latte": "iced matcha",
  "iced saffron latte": "iced saffon latte",
  "vienna choco bread": "vienna choco",
  "vienna bread": "vienna",
  "viennese bread classic": "vienna",
  "viennese bread choc chips": "vienna choco",
  "hot chocolate classic": "hot chocolate",
  "matcha latte": "iced matcha",
  "pain 4 chocolat": "pain au chocolat",
  "pain 4 chocolat box of 4": "pain au chocolat box of 4",
  "chocolate cramique": "cramique",
  "chocolate chip cramique": "cramique",
  "tartine bread": "tartine",
  "rye bread": "rye",
  "tiramisu": "classic tiramisu",
  "basque cheesecake": "burnt basque cheesecake",
  "espresso single": "espresso",
  "espresso double": "espresso",
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
  // 1. B2B bakery catalog (exact)
  const exact = CATALOG_MAP[key];
  if (exact) return `${IMG_BASE}${encodeURIComponent(exact)}.jpg`;
  // 2. B2B bakery catalog (partial)
  for (const [k, v] of Object.entries(CATALOG_MAP)) {
    if (key.includes(k) || k.includes(key)) return `${IMG_BASE}${encodeURIComponent(v)}.jpg`;
  }
  // 3. Talabat alias normalization
  const aliased = TALABAT_ALIASES[key] ?? key;
  // 4. Talabat CDN (exact)
  if (TALABAT_MAP[aliased]) return TALABAT_MAP[aliased];
  // 5. Talabat CDN (partial) — prefer longer keys first for better match
  const entries = Object.entries(TALABAT_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of entries) {
    if (aliased.includes(k) || k.includes(aliased)) return v;
  }
  return null;
}

function ProductThumbWithFallback({ name, size = 56, idx = 0 }: {
  name: string; size?: number; idx?: number;
}) {
  const [failed, setFailed] = useState(false);
  const url = productImgUrl(name);
  const bg = THUMB_COLORS[idx % THUMB_COLORS.length];
  const initial = name.charAt(0).toUpperCase();
  const radius = size <= 36 ? 10 : 14;

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Nunito', fontWeight: 800, fontSize: Math.round(size * 0.36),
      color: 'var(--text-2)',
    }}>
      {initial}
    </div>
  );
}

function StarPhoto({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const url = productImgUrl(name);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      {url && !failed ? (
        <img className="star-photo" src={url} alt={name} onError={() => setFailed(true)} />
      ) : (
        <div className="star-photo" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: THUMB_COLORS[0], fontFamily: 'Nunito', fontWeight: 800,
          fontSize: 48, color: 'var(--text-2)',
        }}>
          {initial}
        </div>
      )}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 200 180">
        <g fill="#FFD66B">
          <path d="M 30 40 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z"/>
          <path d="M 170 30 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z"/>
        </g>
        <g fill="#F9A8B4">
          <path d="M 160 130 l 2 -5 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 z"/>
          <path d="M 25 110 l 2 -5 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 z"/>
        </g>
        <g fill="#7DD3A8">
          <circle cx="50" cy="150" r="2"/>
          <circle cx="150" cy="60" r="2"/>
        </g>
      </svg>
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
  const units = item.spark.reduce((s, v) => s + v, 0);
  return (
    <div className="star-card">
      <div className="star-pills">
        <span className="star-pill dark">★ BEST SELLER</span>
        <span className="star-pill rose">🔥 +{item.delta}%</span>
      </div>
      <StarPhoto name={item.name} />
      <div>
        <div className="star-name">{item.name}</div>
        <div className="star-delta">
          +{item.delta}%
          <small>vs hier</small>
        </div>
      </div>
      <div className="star-stats">
        <div className="star-stat">
          <div className="v">{Math.round(units)}</div>
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
          <div className="podium-head">PODIUM DU JOUR</div>
          {items.slice(1, 3).map((p, i) => (
            <div className="podium-row" key={p.name}>
              <div className={`podium-rank ${i === 0 ? "silver" : "bronze"}`}>
                {i === 0 ? "2e" : "3e"}
              </div>
              <ProductThumbWithFallback name={p.name} size={32} idx={i + 1} />
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
  // Star = first growth product that has a matching catalog image.
  // If none, fall back to #1 growth (with pastel placeholder).
  const star = growth.find((p) => productImgUrl(p.name)) ?? growth[0];

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
