import { RoleGate } from "@/components/shell/RoleGate";
import { CuratorConsole } from "@/components/app/CuratorConsole";

export default function CuratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Curator console</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Allocation, rebalancing, harvests and withdrawal fulfillment — the operator surface that mirrors the keeper.
        </p>
      </div>
      <RoleGate requires="curator">
        <CuratorConsole />
      </RoleGate>
    </div>
  );
}
