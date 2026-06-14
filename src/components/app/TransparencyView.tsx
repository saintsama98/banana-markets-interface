"use client";

import { useVault } from "@/hooks/useVault";
import { useAllocations } from "@/hooks/useAllocations";
import { STRATEGY_CONFIGS } from "@/lib/strategies";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED, EXPLORER_URL, HAS_EXPLORER } from "@/lib/contracts";
import { Panel, PanelHeader, PageHeader, Stat, Skeleton, Tag } from "@/components/ui/primitives";
import { AllocationBar } from "@/components/ui/AllocationBar";
import { formatUsd, formatUsdCompact, bpsToPct } from "@/lib/format";

const EXTERNAL = [
  { label: "Block explorer", href: VAULT_ADDRESS ? `${EXPLORER_URL}/address/${VAULT_ADDRESS}` : EXPLORER_URL, ready: IS_VAULT_CONFIGURED && HAS_EXPLORER },
  { label: "DefiLlama", href: "#", ready: false },
  { label: "Dune dashboard", href: "#", ready: false },
];

/** Ethena-style live reserve/allocation transparency surface. */
export function TransparencyView() {
  const { data: vault, isLoading } = useVault();
  const alloc = useAllocations();

  const deployed =
    vault.totalAssets !== undefined && vault.idleAssets !== undefined ? vault.totalAssets - vault.idleAssets : undefined;
  const idleFrac =
    vault.totalAssets !== undefined && vault.totalAssets > 0n && vault.idleAssets !== undefined
      ? Number(vault.idleAssets) / Number(vault.totalAssets)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Transparency">
        Real-time backing and allocation. Every figure here is read directly from the vault contract — no off-chain
        accounting, nothing to take on trust.
      </PageHeader>

      {/* Backing metrics */}
      <Panel>
        <PanelHeader title="Backing" hint="Total assets held by the vault" />
        <div className="grid grid-cols-2 gap-6 px-5 py-5 sm:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </>
          ) : (
            <>
              <Stat label="Total backing" value={formatUsdCompact(vault.totalAssets, vault.assetDecimals)} accent="matcha" />
              <Stat label="Deployed" value={formatUsd(deployed, vault.assetDecimals)} sub="across strategies" />
              <Stat label="Idle reserve" value={formatUsd(vault.idleAssets, vault.assetDecimals)} sub={`${(idleFrac * 100).toFixed(1)}% liquid`} />
              <Stat label="Reserve floor" value={bpsToPct(vault.idleReserveBps)} sub="minimum kept liquid" />
            </>
          )}
        </div>
      </Panel>

      {/* Deployed vs idle composition */}
      <Panel>
        <PanelHeader title="Composition" hint="Deployed vs liquid reserve" />
        <div className="px-5 py-5">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3 ring-1 ring-inset ring-line">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(1 - idleFrac) * 100}%` }} />
            <div className="h-full bg-venue-idle transition-all duration-500" style={{ width: `${idleFrac * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1.5 text-fg-muted">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Deployed {((1 - idleFrac) * 100).toFixed(1)}%
            </span>
            <span className="flex items-center gap-1.5 text-fg-muted">
              <span className="h-2.5 w-2.5 rounded-sm bg-venue-idle" /> Idle {(idleFrac * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </Panel>

      {/* Allocation breakdown */}
      <Panel>
        <PanelHeader title="Allocation" hint="Live capital across strategies" />
        <div className="px-5 py-5">
          {alloc.isLoading ? (
            <Skeleton className="h-24" />
          ) : alloc.rows.length === 0 ? (
            <div className="py-6 text-center text-xs text-fg-faint">No strategies registered.</div>
          ) : (
            <AllocationBar rows={alloc.rows} mode="live" />
          )}
        </div>
      </Panel>

      {/* Dependencies & oracles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Dependencies & oracles" hint="External venues this vault relies on" />
          <ul className="divide-y divide-line px-5">
            {STRATEGY_CONFIGS.map((cfg) => (
              <li key={cfg.slug} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
                  <span className="text-sm font-medium text-fg">{cfg.venue}</span>
                </div>
                <span className="text-2xs text-fg-faint">{cfg.contracts[cfg.contracts.length - 1]?.value ?? "—"}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Verify independently" hint="External data sources" />
          <ul className="divide-y divide-line px-5">
            {EXTERNAL.map((e) => (
              <li key={e.label} className="flex items-center justify-between gap-3 py-3.5">
                <span className="text-sm text-fg-muted">{e.label}</span>
                {e.ready ? (
                  <a href={e.href} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                    open ↗
                  </a>
                ) : (
                  <Tag>soon</Tag>
                )}
              </li>
            ))}
          </ul>
          <div className="px-5 pb-4 text-2xs leading-relaxed text-fg-faint">
            Historical backing, allocation drift and proof-of-reserve attestations attach here once an indexer is wired.
          </div>
        </Panel>
      </div>
    </div>
  );
}
