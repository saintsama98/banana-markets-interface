"use client";

import { IS_VAULT_CONFIGURED, ACTIVE_CHAIN } from "@/lib/contracts";

/**
 * Shown until NEXT_PUBLIC_VAULT_ADDRESS is set. The diamond is still in
 * development, so the app runs in skeleton mode: layout + theme render, on-chain
 * reads are disabled, this banner explains why.
 */
export function NotDeployedBanner() {
  if (IS_VAULT_CONFIGURED) return null;
  return (
    <div className="mb-6 rounded-card border-2 border-ink bg-warning/20 px-5 py-4 shadow-ink-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-warning font-display text-2xs font-bold text-canvas"
        >
          !
        </span>
        <div>
          <div className="font-display text-sm font-medium text-warning">Vault not yet deployed</div>
          <p className="mt-1 max-w-2xl text-xs text-fg-muted">
            Set <code className="num-mono rounded bg-surface-3 px-1 py-0.5 text-fg">NEXT_PUBLIC_VAULT_ADDRESS</code> in{" "}
            <code className="num-mono rounded bg-surface-3 px-1 py-0.5 text-fg">.env.local</code> to the deployed Vault
            Router diamond on <span className="text-fg">{ACTIVE_CHAIN.name}</span>. Until then the interface renders
            with placeholder data so layout and theme can be reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
