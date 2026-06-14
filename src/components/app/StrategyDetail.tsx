"use client";

import Link from "next/link";
import { useVault } from "@/hooks/useVault";
import { useAllocations } from "@/hooks/useAllocations";
import { useRole } from "@/hooks/useRole";
import { type StrategyConfig } from "@/lib/strategies";
import { Panel, PanelHeader, Stat, Skeleton, Tag } from "@/components/ui/primitives";
import { PerformancePanel } from "./PerformancePanel";
import { DepositCard } from "./DepositCard";
import { ActivityPanel } from "./ActivityPanel";
import { formatUsd, bpsToPct, shortAddress } from "@/lib/format";

export function StrategyDetail({ config }: { config: StrategyConfig }) {
  const { data: vault } = useVault();
  const alloc = useAllocations();
  const { owner } = useRole();

  const row = alloc.rows.find((r) => r.meta.key === config.key);
  const live = row ? row.liveFraction * 100 : undefined;
  const target = row?.targetBps !== undefined ? row.targetBps / 100 : undefined;
  const drift = live !== undefined && target !== undefined ? live - target : undefined;
  const capUse =
    row?.assets !== undefined && row?.capBps && row.capBps > 0 && vault.totalAssets !== undefined && vault.totalAssets > 0n
      ? (Number(row.assets) / Number(vault.totalAssets)) * 10_000 / row.capBps * 100
      : undefined;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="glass-soft inline-flex items-center gap-2 rounded-card border-2 border-ink px-3 py-1.5 text-xs text-fg-muted">
        <Link href="/app/strategies" className="hover:text-accent">
          Strategies
        </Link>
        <span className="text-fg-faint">/</span>
        <span className="text-fg">{config.venue}</span>
      </div>

      {/* Header */}
      <Panel>
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink text-2xl"
              style={{ color: config.color, background: `${config.color}14` }}
            >
              {config.glyph}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-fg">{config.venue}</h1>
                <Tag>{config.kind}</Tag>
              </div>
              <p className="mt-1 max-w-xl text-sm text-fg-muted">USDC · {config.apyLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {row?.quarantined ? (
              <Tag tone="negative">quarantined</Tag>
            ) : drift !== undefined && Math.abs(drift) > 1 ? (
              <Tag tone="warning">
                {drift > 0 ? "+" : ""}
                {drift.toFixed(1)}% drift
              </Tag>
            ) : row ? (
              <Tag tone="matcha">on target</Tag>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-line px-5 py-5 sm:grid-cols-4">
          <Stat label={config.apyLabel} value="—" accent="matcha" sub="needs history" />
          <Stat label="Allocated" value={row ? formatUsd(row.assets, vault.assetDecimals) : "—"} />
          <Stat label="Live / target" value={live !== undefined ? `${live.toFixed(1)}%` : "—"} sub={`tgt ${bpsToPct(row?.targetBps)}`} />
          <Stat label="Cap" value={bpsToPct(row?.capBps, 0)} sub={capUse !== undefined ? `${capUse.toFixed(0)}% used` : undefined} />
        </div>
      </Panel>

      <div className="glass-soft inline-block max-w-3xl rounded-card border-2 border-ink px-5 py-4 shadow-[3px_3px_0_0_#141412]">
        <p className="text-sm leading-relaxed text-fg">{config.blurb}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* APY breakdown */}
          <Panel>
            <PanelHeader title="Yield breakdown" hint="Net = native × (1 − perf fee) + rewards − mgmt fee" />
            <div className="divide-y divide-line px-5">
              <BreakdownRow label="Native yield" value="—" muted />
              <BreakdownRow label="Rewards APR" value="—" muted />
              <BreakdownRow label={`Performance fee (${bpsToPct(vault.performanceFeeBps, 0)})`} value="on yield only" muted />
              <BreakdownRow label={`Management fee (${bpsToPct(vault.managementFeeBps, 0)})`} value="on total assets" muted />
              <BreakdownRow label="Net APY" value="—" strong />
            </div>
            <div className="px-5 pb-4 text-2xs text-fg-faint">
              Realized APY is derived from share-price history — available once an indexer snapshots the vault over time.
            </div>
          </Panel>

          {/* Allocation & caps */}
          <Panel>
            <PanelHeader title="Allocation & caps" hint="Where this venue sits in the book" />
            <div className="space-y-4 px-5 py-5">
              {alloc.isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    <Stat label="Assets" value={row ? formatUsd(row.assets, vault.assetDecimals) : "—"} mono />
                    <Stat label="Live" value={live !== undefined ? `${live.toFixed(1)}%` : "—"} mono />
                    <Stat label="Target" value={bpsToPct(row?.targetBps)} mono />
                    <Stat label="Cap" value={bpsToPct(row?.capBps, 0)} mono />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-2xs text-fg-faint">
                      <span>Live allocation</span>
                      <span>Cap {bpsToPct(row?.capBps, 0)}</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, live ?? 0)}%`, backgroundColor: config.color }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Panel>

          {/* TVL · share price · APY history (indexed from on-chain events) */}
          <PerformancePanel color={config.color} />

          {/* Risk params + contracts */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Panel>
              <PanelHeader title="Risk parameters" />
              <ul className="divide-y divide-line px-5">
                {config.riskParams.map((p) => (
                  <li key={p.label} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <div className="text-xs text-fg-muted">{p.label}</div>
                      {p.hint && <div className="text-2xs text-fg-faint">{p.hint}</div>}
                    </div>
                    <span className="num shrink-0 text-right text-xs font-medium text-fg">{p.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelHeader title="Contracts & oracle" />
              <ul className="divide-y divide-line px-5">
                {config.contracts.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-xs text-fg-muted">{c.label}</span>
                    <span className="num-mono shrink-0 text-xs text-fg-faint">{c.value}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 py-3">
                  <span className="text-xs text-fg-muted">Curator</span>
                  <span className="num-mono shrink-0 text-xs text-fg-faint">{shortAddress(owner)}</span>
                </li>
              </ul>
            </Panel>
          </div>

          <ActivityPanel limit={6} />
        </div>

        {/* Deposit widget */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <DepositCard />
          <div className="glass-soft mt-3 rounded-card border-2 border-ink px-3 py-2.5 shadow-[3px_3px_0_0_#141412]">
            <p className="text-2xs leading-relaxed text-fg-muted">
              Deposits buy a share of the whole vault, not this strategy alone. The keeper routes capital toward
              targets; you hold blended, risk-gated exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className={strong ? "text-sm font-semibold text-fg" : "text-sm text-fg-muted"}>{label}</span>
      <span className={`num ${strong ? "text-sm font-semibold text-accent" : muted ? "text-xs text-fg-faint" : "text-sm text-fg"}`}>
        {value}
      </span>
    </div>
  );
}
