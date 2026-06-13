"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { AbiEvent, Hex } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED, ACTIVE_CHAIN_ID } from "@/lib/contracts";

/**
 * The vault's activity events, pulled from the ABI's event entries — minus
 * `StrategyHarvested`, which the keeper emits on every strategy every harvest
 * cycle with NO economic payload (no amount). Left in, those no-op events flood
 * the bounded feed and bury the meaningful lifecycle (deposits, rebalances,
 * allocation changes, withdrawals). Excluded so the timeline stays signal, not noise.
 */
const ACTIVITY_EVENTS = vaultAbi.filter(
  (e) => e.type === "event" && e.name !== "StrategyHarvested",
) as AbiEvent[];

/**
 * How far back (in blocks) to scan for activity. Arbitrum blocks are sub-second,
 * so this is a best-effort recent window, not full history — back it with an
 * indexer/subgraph for a complete audit trail. Kept modest to stay within the
 * getLogs range limits public RPCs impose.
 */
const BLOCK_WINDOW = 100_000n;

/**
 * Optional floor for the log scan's `fromBlock`. On an anvil mainnet fork the
 * deploy block sits at the fork tip; a fixed `latest - BLOCK_WINDOW` lookback
 * reaches back past it, so anvil proxies historical logs upstream and returns
 * nothing. When set (the fork demo), never scan below this block. Unset on real
 * chains => behavior is unchanged. String env => BigInt(); guarded against
 * empty/invalid values so absence is a no-op.
 */
const DEPLOY_BLOCK: bigint | undefined = (() => {
  const raw = process.env.NEXT_PUBLIC_DEPLOY_BLOCK;
  if (!raw || raw.trim() === "") return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
})();

/** Max rows surfaced from one scan. */
const MAX_ROWS = 25;

export type ActivityKind =
  | "deposit"
  | "withdraw"
  | "request"
  | "cancel"
  | "fulfill"
  | "rebalance"
  | "allocation"
  | "quarantine"
  | "harvest";

export interface ActivityItem {
  key: string;
  kind: ActivityKind;
  txHash: Hex;
  blockNumber: bigint;
  logIndex: number;
  /** unix seconds, resolved per-block (best effort) */
  timestamp?: number;
  /** primary actor address when the event names one */
  actor?: Hex;
  /** asset-denominated amount (USDC base units) when applicable */
  assets?: bigint;
  /** share-denominated amount when applicable */
  shares?: bigint;
  /** withdrawal request id for queue events */
  id?: bigint;
  /** strategy id for strategy events */
  strategyId?: Hex;
}

/** Minimal shape of a decoded viem log when scanning multiple events. */
type DecodedLog = {
  eventName?: string;
  args?: Record<string, unknown>;
  transactionHash: Hex | null;
  blockNumber: bigint | null;
  logIndex: number | null;
};

function kindOf(name: string): ActivityKind | undefined {
  switch (name) {
    case "Deposit":
      return "deposit";
    case "Withdraw":
      return "withdraw";
    case "WithdrawRequested":
      return "request";
    case "WithdrawCancelled":
      return "cancel";
    case "WithdrawFulfilled":
      return "fulfill";
    case "Rebalanced":
      return "rebalance";
    case "AllocationSet":
      return "allocation";
    case "StrategyQuarantined":
      return "quarantine";
    case "StrategyHarvested":
      return "harvest";
    default:
      return undefined;
  }
}

/**
 * Recent on-chain vault activity, decoded from event logs.
 *
 * Scans a bounded recent block window for every event the ABI declares, decodes
 * each into a normalized timeline item, then resolves block timestamps for the
 * rows in view. Refetches every 20s. Errors (e.g. RPC range caps) surface via
 * `isError` so the feed degrades gracefully instead of throwing.
 */
export function useActivity() {
  const client = usePublicClient();

  const query = useQuery({
    queryKey: ["activity", ACTIVE_CHAIN_ID, VAULT_ADDRESS],
    enabled: IS_VAULT_CONFIGURED && !!client && !!VAULT_ADDRESS,
    refetchInterval: 20_000,
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!client || !VAULT_ADDRESS) return [];

      const latest = await client.getBlockNumber();
      const windowed = latest > BLOCK_WINDOW ? latest - BLOCK_WINDOW : 0n;
      // On the fork, never scan below the deploy block (avoids proxied upstream
      // logs returning empty). On real chains DEPLOY_BLOCK is undefined => keep
      // the rolling window unchanged.
      const fromBlock = DEPLOY_BLOCK !== undefined ? (windowed > DEPLOY_BLOCK ? windowed : DEPLOY_BLOCK) : windowed;

      const logs = (await client.getLogs({
        address: VAULT_ADDRESS,
        events: ACTIVITY_EVENTS,
        fromBlock,
        toBlock: "latest",
      })) as unknown as DecodedLog[];

      // Newest first (block desc, then logIndex desc), then cap.
      const sorted = [...logs]
        .sort((a, b) => {
          const ab = a.blockNumber ?? 0n;
          const bb = b.blockNumber ?? 0n;
          if (ab !== bb) return ab > bb ? -1 : 1;
          return (b.logIndex ?? 0) - (a.logIndex ?? 0);
        })
        .slice(0, MAX_ROWS);

      // Resolve timestamps for the unique blocks actually in view.
      const uniqueBlocks = [...new Set(sorted.map((l) => l.blockNumber).filter((b): b is bigint => b !== null))];
      const blocks = await Promise.all(
        uniqueBlocks.map((bn) => client.getBlock({ blockNumber: bn }).catch(() => undefined)),
      );
      const tsByBlock = new Map<bigint, number>();
      uniqueBlocks.forEach((bn, i) => {
        const t = blocks[i]?.timestamp;
        if (t !== undefined) tsByBlock.set(bn, Number(t));
      });

      const items: ActivityItem[] = [];
      for (const log of sorted) {
        const kind = log.eventName ? kindOf(log.eventName) : undefined;
        if (!kind || log.transactionHash === null || log.blockNumber === null) continue;
        const args = log.args ?? {};
        items.push({
          key: `${log.transactionHash}-${log.logIndex ?? 0}`,
          kind,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.logIndex ?? 0,
          timestamp: tsByBlock.get(log.blockNumber),
          actor: (args.owner ?? args.receiver ?? args.caller ?? args.by ?? args.account) as Hex | undefined,
          assets: (args.assets ?? args.totalAssets) as bigint | undefined,
          shares: args.shares as bigint | undefined,
          id: args.id as bigint | undefined,
          strategyId: args.strategyId as Hex | undefined,
        });
      }
      return items;
    },
  });

  return {
    isConfigured: IS_VAULT_CONFIGURED,
    isLoading: query.isLoading,
    isError: query.isError,
    items: query.data ?? [],
    refetch: query.refetch,
  };
}
