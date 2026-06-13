"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useAllocations, type StrategyRow } from "@/hooks/useAllocations";
import { useRole } from "@/hooks/useRole";
import { Panel, PanelHeader, Skeleton, Tag, StatusDot } from "@/components/ui/primitives";
import { WithdrawQueuePanel } from "./WithdrawQueuePanel";
import { ActivityPanel } from "./ActivityPanel";
import { formatUsd, bpsToPct } from "@/lib/format";

export function CuratorConsole() {
  const { data: vault } = useVault();
  const alloc = useAllocations();
  const { isCurator } = useRole();

  const { writeContract, data: hash, isPending, variables } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || mining;

  function call(functionName: "rebalance" | "harvestAll") {
    if (!VAULT_ADDRESS) return;
    writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName, args: [] });
  }
  function harvestOne(id: `0x${string}`) {
    if (!VAULT_ADDRESS) return;
    writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "harvest", args: [id] });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line bg-surface-1 px-5 py-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-sm bg-accent" />
          <div className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg">Automated by the keeper.</span> These actions are normally driven
            off-chain on a schedule (rebalance hourly, harvest every 6h, guard checkpoints every 5m). The controls below
            are a manual operator override — anything you trigger lands on-chain exactly as the keeper's would.
          </div>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="Operations"
          hint="Curator-gated · one rebalance per block"
          right={<StatusDot tone={vault.paused ? "negative" : "positive"} label={vault.paused ? "Paused" : "Active"} />}
        />
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <button onClick={() => call("rebalance")} disabled={busy || !isCurator} className="btn-primary">
            {busy && variables?.functionName === "rebalance" ? "Rebalancing…" : "Rebalance to targets"}
          </button>
          <button onClick={() => call("harvestAll")} disabled={busy || !isCurator} className="btn-ghost">
            {busy && variables?.functionName === "harvestAll" ? "Harvesting…" : "Harvest all"}
          </button>
          {!isCurator && (
            <span className="text-2xs text-fg-faint">
              Keeper-automated · manual override available only to an authorized curator/owner.
            </span>
          )}
          <div className="ml-auto flex items-center gap-4 text-xs text-fg-muted">
            <span>
              Idle: <span className="num text-fg">{formatUsd(vault.idleAssets, vault.assetDecimals)}</span>
            </span>
            <span>
              Reserve floor:{" "}
              <span className="num text-fg">{vault.idleReserveBps !== undefined ? bpsToPct(vault.idleReserveBps) : "—"}</span>
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Strategies" hint="Live vs target allocation" />
        <div className="overflow-x-auto">
          {alloc.isLoading ? (
            <div className="space-y-2 px-5 py-5">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : alloc.rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-fg-faint">No strategies registered.</div>
          ) : (
            <table className="dtable min-w-[680px]">
              <thead>
                <tr>
                  <th className="pl-5">Strategy</th>
                  <th className="text-right">Assets</th>
                  <th className="text-right">Live</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Cap</th>
                  <th>Status</th>
                  <th className="pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {alloc.rows.map((r) => (
                  <StrategyRowView key={r.id} row={r} assetDecimals={vault.assetDecimals} busy={busy} canHarvest={isCurator} onHarvest={() => harvestOne(r.id)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      <WithdrawQueuePanel />
      <ActivityPanel />
    </div>
  );
}

function StrategyRowView({
  row,
  assetDecimals,
  busy,
  canHarvest,
  onHarvest,
}: {
  row: StrategyRow;
  assetDecimals: number;
  busy: boolean;
  canHarvest: boolean;
  onHarvest: () => void;
}) {
  const drift = row.targetBps !== undefined ? row.liveFraction * 100 - row.targetBps / 100 : 0;
  return (
    <tr>
      <td className="pl-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.meta.color }} />
          <span className="font-display font-semibold text-fg">{row.meta.label}</span>
        </div>
      </td>
      <td className="cell-num text-fg">{formatUsd(row.assets, assetDecimals)}</td>
      <td className="cell-num text-fg">{(row.liveFraction * 100).toFixed(1)}%</td>
      <td className="cell-num text-fg-muted">{bpsToPct(row.targetBps)}</td>
      <td className="cell-num text-fg-faint">{bpsToPct(row.capBps, 0)}</td>
      <td>
        {row.quarantined ? (
          <Tag tone="negative">quarantined</Tag>
        ) : Math.abs(drift) > 1 ? (
          <Tag tone="warning">
            {drift > 0 ? "+" : ""}
            {drift.toFixed(1)}% drift
          </Tag>
        ) : (
          <Tag tone="matcha">on target</Tag>
        )}
      </td>
      <td className="pr-5 text-right">
        <button
          onClick={onHarvest}
          disabled={busy || row.quarantined || !canHarvest}
          title={canHarvest ? undefined : "Keeper-automated — manual override requires an authorized curator/owner wallet"}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Harvest
        </button>
      </td>
    </tr>
  );
}
