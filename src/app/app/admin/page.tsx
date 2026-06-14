import { RoleGate } from "@/components/shell/RoleGate";
import { AdminConsole } from "@/components/app/AdminConsole";
import { PageHeader } from "@/components/ui/primitives";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin">
        Owner-only governance: circuit breaker, fees, risk bounds and two-step ownership.
      </PageHeader>
      <RoleGate requires="owner">
        <AdminConsole />
      </RoleGate>
    </div>
  );
}
