"use client";

import type { ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { formatUnits } from "viem";
import { useVault } from "@/hooks/useVault";
import { useAllocations } from "@/hooks/useAllocations";
import { Panel, PanelHeader, Skeleton, StatusDot } from "@/components/ui/primitives";
import { AllocationBar } from "@/components/ui/AllocationBar";
import { bpsToPct } from "@/lib/format";

function StatBlock({ label, children, sub }: { label: string; children: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div className="overline">{label}</div>
      <div className="num mt-1 truncate text-2xl font-semibold leading-tight text-fg">{children}</div>
      {sub && <div className="mt-0.5 text-2xs text-fg-faint">{sub}</div>}
    </div>
  );
}

/** Top-of-dashboard strip: mono-numeral stat blocks divided by hairlines. */
export function VaultStats() {
  const { data, isLoading } = useVault();

  const tvl =
    data.totalAssets !== undefined ? Number(formatUnits(data.totalAssets, data.assetDecimals)) : undefined;
  const sharePrice = data.sharePrice;

  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="font-display text-sm font-semibold text-fg">{data.name ?? "USDC router vault"}</div>
        <StatusDot tone={data.paused ? "negative" : "positive"} label={data.paused ? "Paused" : "Active"} />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          <StatBlock label="TVL">
            {tvl !== undefined ? (
              <span className="text-accent">
                <NumberFlow
                  value={tvl}
                  format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }}
                />
              </span>
            ) : (
              <span className="text-fg-faint">—</span>
            )}
          </StatBlock>
          <StatBlock label="Share price" sub="assets / share">
            {sharePrice !== undefined ? (
              <NumberFlow value={sharePrice} format={{ minimumFractionDigits: 4, maximumFractionDigits: 4 }} />
            ) : (
              <span className="text-fg-faint">—</span>
            )}
          </StatBlock>
          <StatBlock label="Idle reserve" sub="kept liquid">
            {data.idleReserveBps !== undefined ? bpsToPct(data.idleReserveBps) : "—"}
          </StatBlock>
          <StatBlock label="Perf / mgmt fee">
            {data.performanceFeeBps !== undefined
              ? `${bpsToPct(data.performanceFeeBps, 0)} / ${bpsToPct(data.managementFeeBps, 0)}`
              : "—"}
          </StatBlock>
        </div>
      )}
    </Panel>
  );
}

/** Live capital split across strategies — sits beside the focal deposit widget. */
export function AllocationPanel() {
  const alloc = useAllocations();
  return (
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
  );
}
