import { RoleGate } from "@/components/shell/RoleGate";
import { AdminConsole } from "@/components/app/AdminConsole";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Admin</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Owner-only governance: circuit breaker, fees, risk bounds and two-step ownership.
        </p>
      </div>
      <RoleGate requires="owner">
        <AdminConsole />
      </RoleGate>
    </div>
  );
}
