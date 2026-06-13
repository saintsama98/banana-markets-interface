"use client";

import type { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRole, type Role } from "@/hooks/useRole";
import { Panel, LockIcon } from "@/components/ui/primitives";

const RANK: Record<Role, number> = { disconnected: 0, user: 1, curator: 2, owner: 3 };

/** Gate a surface behind a minimum role. Renders a lock panel when under-privileged. */
export function RoleGate({ requires, children }: { requires: "curator" | "owner"; children: ReactNode }) {
  const { role, isLoading } = useRole();

  if (RANK[role] >= RANK[requires]) return <>{children}</>;

  return (
    <Panel className="mx-auto mt-10 max-w-lg">
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-fg-faint">
          <LockIcon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-base font-semibold text-fg">
          {requires === "owner" ? "Owner" : "Curator"} access required
        </h2>
        <p className="mt-2 max-w-sm text-sm text-fg-muted">
          {role === "disconnected"
            ? "Connect the wallet that holds this role to access the console."
            : isLoading
              ? "Checking your role on-chain…"
              : `The connected wallet is a ${role}. This surface is restricted to the vault ${requires}.`}
        </p>
        {role === "disconnected" && (
          <div className="mt-5">
            <ConnectButton showBalance={false} />
          </div>
        )}
      </div>
    </Panel>
  );
}
