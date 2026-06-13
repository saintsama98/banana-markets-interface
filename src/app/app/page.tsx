import { VaultStats, AllocationPanel } from "@/components/app/VaultStats";
import { DepositCard } from "@/components/app/DepositCard";
import { PositionPanel } from "@/components/app/PositionPanel";
import { WithdrawQueuePanel } from "@/components/app/WithdrawQueuePanel";
import { ActivityPanel } from "@/components/app/ActivityPanel";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Deposit USDC and earn risk-gated yield routed across Aave, Morpho and Pendle.
        </p>
      </div>

      {/* Top strip: mono-numeral vault stats */}
      <VaultStats />

      {/* Focal row: the deposit widget is the product — centered and oversized,
          with position and allocation arranged around it. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <PositionPanel />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <DepositCard />
        </div>
        <div className="order-3">
          <AllocationPanel />
        </div>
      </div>

      {/* Ledger row: dense tables, full width */}
      <WithdrawQueuePanel />
      <ActivityPanel limit={10} />
    </div>
  );
}
