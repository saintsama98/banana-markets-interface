import { StrategyList } from "@/components/app/StrategyList";

export default function StrategiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Strategies</h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          The vault routes USDC across these venues under curator-set targets and caps. Each is a self-contained,
          capped module behind a single share price — open one for its risk parameters, allocation and contracts.
        </p>
      </div>
      <StrategyList />
    </div>
  );
}
