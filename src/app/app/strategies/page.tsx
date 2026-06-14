import { StrategyList } from "@/components/app/StrategyList";
import { PageHeader } from "@/components/ui/primitives";

export default function StrategiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Strategies">
        The vault routes USDC across these venues under curator-set targets and caps. Each is a self-contained, capped
        module behind a single share price — open one for its risk parameters, allocation and contracts.
      </PageHeader>
      <StrategyList />
    </div>
  );
}
