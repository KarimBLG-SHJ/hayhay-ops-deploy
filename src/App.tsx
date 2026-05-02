import { useSnapshot } from "./api/useSnapshot";
import { Sidebar } from "./components/Sidebar";
import { KpisRow } from "./components/KpisRow";
import { HeroCurve } from "./components/HeroCurve";
import { AgentsGrid } from "./components/AgentsGrid";
import { ProductsRow } from "./components/ProductsRow";
import { ReconciliationPanel } from "./components/ReconciliationPanel";
import { RightRail } from "./components/RightRail";

export default function App() {
  const snap = useSnapshot(60_000);

  return (
    <div className="app">
      <Sidebar snap={snap} />
      <main className="main-col">
        <KpisRow snap={snap} />
        <HeroCurve hero={snap.hero} loading={snap.loading} />
        <AgentsGrid snap={snap} />
        <ProductsRow snap={snap} />
        <ReconciliationPanel />
      </main>
      <RightRail snap={snap} />
    </div>
  );
}
