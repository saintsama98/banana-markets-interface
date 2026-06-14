import { RoleGate } from "@/components/shell/RoleGate";
import { CuratorConsole } from "@/components/app/CuratorConsole";
import { PageHeader } from "@/components/ui/primitives";

export default function CuratorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Curator console">
        Allocation, rebalancing, harvests and withdrawal fulfillment — the operator surface that mirrors the keeper.
      </PageHeader>
      <RoleGate requires="curator">
        <CuratorConsole />
      </RoleGate>
    </div>
  );
}
