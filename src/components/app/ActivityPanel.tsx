"use client";

import { useActivity, type ActivityItem, type ActivityKind } from "@/hooks/useActivity";
import { useVault } from "@/hooks/useVault";
import { EXPLORER_URL, HAS_EXPLORER } from "@/lib/contracts";
import { resolveStrategy } from "@/lib/strategies";
import { Panel, PanelHeader, Skeleton, cx } from "@/components/ui/primitives";
import { formatUsd, formatAmount, shortAddress, relativeAgo } from "@/lib/format";

const META: Record<ActivityKind, { label: string; chip: string }> = {
  deposit: { label: "Deposit", chip: "bg-up/20 text-fg" },
  withdraw: { label: "Withdraw", chip: "bg-surface-3 text-fg" },
  request: { label: "Exit requested", chip: "bg-warning/25 text-fg" },
  cancel: { label: "Exit cancelled", chip: "bg-surface-2 text-fg-muted" },
  fulfill: { label: "Exit fulfilled", chip: "bg-accent/25 text-fg" },
  rebalance: { label: "Rebalanced", chip: "bg-accent/25 text-fg" },
  allocation: { label: "Allocation set", chip: "bg-accent/25 text-fg" },
  quarantine: { label: "Quarantined", chip: "bg-down/20 text-fg" },
  harvest: { label: "Harvested", chip: "bg-accent/25 text-fg" },
};

/** On-chain audit trail of vault events — a dense table, not cards. */
export function ActivityPanel({ limit }: { limit?: number }) {
  const { items, isLoading, isError } = useActivity();
  const { data: vault } = useVault();
  const rows = limit ? items.slice(0, limit) : items;
  const shareDecimals = vault.shareDecimals ?? 18;

  return (
    <Panel>
      <PanelHeader title="Activity" hint="Recent on-chain vault events" />
      {isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      ) : isError ? (
        <div className="px-5 py-10 text-center text-xs text-fg-faint">
          Couldn’t load events from the RPC. An indexer/subgraph gives the full audit trail.
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-xs text-fg-faint">No vault activity in the scanned window.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="dtable min-w-[640px]">
            <thead>
              <tr>
                <th className="pl-5">Event</th>
                <th className="text-right">Amount</th>
                <th>Actor</th>
                <th className="text-right">Age</th>
                <th className="pr-5 text-right">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <Row key={it.key} item={it} assetDecimals={vault.assetDecimals} shareDecimals={shareDecimals} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function describe(it: ActivityItem, assetDecimals: number, shareDecimals: number): string {
  switch (it.kind) {
    case "deposit":
    case "withdraw":
    case "fulfill":
      return formatUsd(it.assets, assetDecimals);
    case "request":
    case "cancel":
      return it.shares !== undefined ? `${formatAmount(it.shares, shareDecimals, { maxFractionDigits: 2 })} shares` : "";
    case "rebalance":
      return it.assets !== undefined ? `TVL ${formatUsd(it.assets, assetDecimals)}` : "";
    case "allocation":
      return "targets updated";
    case "quarantine":
    case "harvest":
      return it.strategyId ? resolveStrategy(it.strategyId).label : "";
    default:
      return "";
  }
}

function Row({ item, assetDecimals, shareDecimals }: { item: ActivityItem; assetDecimals: number; shareDecimals: number }) {
  const m = META[item.kind];
  const detail = describe(item, assetDecimals, shareDecimals);
  return (
    <tr>
      <td className="pl-5">
        <span className={cx("tag", m.chip)}>{m.label}</span>
      </td>
      <td className="cell-num text-fg">{detail || "—"}</td>
      <td className="num-mono text-xs text-fg-faint">{item.actor ? shortAddress(item.actor) : "—"}</td>
      <td className="cell-num text-2xs text-fg-faint">
        {item.timestamp ? relativeAgo(item.timestamp) : `#${item.blockNumber.toString()}`}
      </td>
      <td className="pr-5 text-right">
        {HAS_EXPLORER ? (
          <a
            href={`${EXPLORER_URL}/tx/${item.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="num-mono text-xs text-fg-muted transition-colors duration-150 hover:text-accent"
          >
            {shortAddress(item.txHash, 6, 4)} ↗
          </a>
        ) : (
          <span className="num-mono text-xs text-fg-faint" title={item.txHash}>
            {shortAddress(item.txHash, 6, 4)}
          </span>
        )}
      </td>
    </tr>
  );
}
