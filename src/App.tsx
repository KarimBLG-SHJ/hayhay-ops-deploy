import { useSnapshot } from "./api/useSnapshot";
import { Sidebar } from "./components/Sidebar";
import { KpisRow } from "./components/KpisRow";
import { HeroCurve } from "./components/HeroCurve";
import { AgentsGrid } from "./components/AgentsGrid";
import { ProductsRow } from "./components/ProductsRow";
import { CockpitRecipesTile } from "./components/CockpitRecipesTile";
import { ReconciliationPanel } from "./components/ReconciliationPanel";
import { RightRail } from "./components/RightRail";
import { useHashRoute } from "./shell/useHashRoute";
import { findItem } from "./shell/nav";
import { ModulePlaceholder } from "./shell/ModulePlaceholder";
import { SalesModule } from "./components/SalesModule";
import { ContextModule } from "./components/ContextModule";
import { StockModule } from "./components/StockModule";
import { CogsModule } from "./components/CogsModule";
import { TalabatModule } from "./components/TalabatModule";
import { LifecycleModule } from "./components/LifecycleModule";
import { RecipesModule } from "./components/RecipesModule";
import { ExternalFrame } from "./shell/ExternalFrame";
import { CoachDock } from "./shell/CoachDock";

function Cockpit({ snap }: { snap: ReturnType<typeof useSnapshot> }) {
  return (
    <>
      <main className="main-col">
        <KpisRow snap={snap} />
        <HeroCurve hero={snap.hero} loading={snap.loading} />
        <AgentsGrid snap={snap} />
        <ProductsRow snap={snap} />
        <CockpitRecipesTile />
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
      ) : route === "sales" ? (
        <SalesModule snap={snap} />
      ) : route === "context" ? (
        <ContextModule snap={snap} />
      ) : route === "stock" ? (
        <StockModule />
      ) : route === "cogs" ? (
        <CogsModule />
      ) : route === "talabat" ? (
        <TalabatModule />
      ) : route === "lifecycle" ? (
        <LifecycleModule />
      ) : route === "recipes" ? (
        <RecipesModule />
      ) : item.kind === "external" ? (
        <ExternalFrame item={item} />
      ) : (
        <ModulePlaceholder item={item} />
      )}
      <CoachDock />
    </div>
  );
}
