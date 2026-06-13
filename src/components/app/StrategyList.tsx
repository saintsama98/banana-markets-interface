"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVault } from "@/hooks/useVault";
import { useAllocations, type StrategyRow } from "@/hooks/useAllocations";
import { STRATEGY_CONFIGS, type StrategyConfig } from "@/lib/strategies";
import { Panel, PanelHeader, Skeleton, Tag } from "@/components/ui/primitives";
import { formatUsd, bpsToPct } from "@/lib/format";

/** Orders-table view of the strategy book: venue rows, allocation bars, status chips. */
export function StrategyList() {
  const { data: vault } = useVault();
  const alloc = useAllocations();
  const router = useRouter();

  const rowFor = (cfg: StrategyConfig): StrategyRow | undefined =>
    alloc.rows.find((r) => r.meta.key === cfg.key);

  return (
    <Panel>
      <PanelHeader title="Strategy book" hint="Live vs target allocation per venue" />
      {alloc.isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="dtable min-w-[760px]">
            <thead>
              <tr>
                <th className="pl-5">Venue</th>
                <th>Type</th>
                <th className="text-right">APY</th>
                <th className="text-right">Allocated</th>
                <th className="w-[220px]">Live / target</th>
                <th className="text-right">Cap</th>
                <th>Status</th>
                <th className="pr-5 text-right" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {STRATEGY_CONFIGS.map((cfg) => {
                const row = rowFor(cfg);
                const live = row ? row.liveFraction * 100 : undefined;
                const drift =
                  row?.targetBps !== undefined && live !== undefined ? live - row.targetBps / 100 : undefined;
                return (
                  <tr
                    key={cfg.slug}
                    className="cursor-pointer"
                    onClick={() => router.push(`/app/strategies/${cfg.slug}`)}
                  >
                    <td className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: cfg.color }} />
                        <span className="font-display font-semibold text-fg">{cfg.venue}</span>
                      </div>
                    </td>
                    <td className="text-xs text-fg-muted">{cfg.kind}</td>
                    <td className="cell-num text-fg-faint">—</td>
                    <td className="cell-num text-fg">{row ? formatUsd(row.assets, vault.assetDecimals) : "—"}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, live ?? 0)}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                        <span className="num text-xs text-fg">
                          {live !== undefined ? `${live.toFixed(1)}%` : "—"}
                          <span className="text-fg-faint"> / {bpsToPct(row?.targetBps)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="cell-num text-fg-faint">{bpsToPct(row?.capBps, 0)}</td>
                    <td>
                      {row?.quarantined ? (
                        <Tag tone="negative">quarantined</Tag>
                      ) : drift !== undefined && Math.abs(drift) > 1 ? (
                        <Tag tone="warning">
                          {drift > 0 ? "+" : ""}
                          {drift.toFixed(1)}% drift
                        </Tag>
                      ) : row ? (
                        <Tag tone="matcha">on target</Tag>
                      ) : (
                        <Tag>pending</Tag>
                      )}
                    </td>
                    <td className="pr-5 text-right">
                      <Link
                        href={`/app/strategies/${cfg.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display text-xs font-semibold text-accent hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-line px-5 py-3 text-2xs text-fg-faint">
        APY columns populate once an indexer snapshots share-price history. Allocation, caps and status are live
        on-chain reads.
      </div>
    </Panel>
  );
}
