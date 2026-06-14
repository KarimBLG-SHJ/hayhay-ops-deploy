import { useSnapshot } from "./api/useSnapshot";
import { Sidebar } from "./components/Sidebar";
import { KpisRow } from "./components/KpisRow";
import { HeroCurve } from "./components/HeroCurve";
import { AgentsGrid } from "./components/AgentsGrid";
import { ProductsRow } from "./components/ProductsRow";
import { ReconciliationPanel } from "./components/ReconciliationPanel";
import { RightRail } from "./components/RightRail";
import { useHashRoute } from "./shell/useHashRoute";
import { findItem } from "./shell/nav";
import { ModulePlaceholder } from "./shell/ModulePlaceholder";
import { CoachDock } from "./shell/CoachDock";

function Cockpit({ snap }: { snap: ReturnType<typeof useSnapshot> }) {
  return (
    <>
      <main className="main-col">
        <KpisRow snap={snap} />
        <HeroCurve hero={snap.hero} loading={snap.loading} />
        <AgentsGrid snap={snap} />
        <ProductsRow snap={snap} />
        <ReconciliationPanel />
      </main>
      <RightRail snap={snap} />
    </>
  );
}

export default function App() {
  const snap = useSnapshot(60_000);
  const [route, navigate] = useHashRoute();
  const item = findItem(route);

  const isModule = route !== "cockpit" && !!item;

  return (
    <div className={`app${isModule ? " module-view" : ""}`}>
      <Sidebar snap={snap} route={route} onNavigate={navigate} />
      {route === "cockpit" || !item ? (
        <Cockpit snap={snap} />
      ) : (
        <ModulePlaceholder item={item} />
      )}
      <CoachDock />
    </div>
  );
}
