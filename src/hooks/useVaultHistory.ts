"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { AbiEvent, Hex } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED, ACTIVE_CHAIN_ID } from "@/lib/contracts";
import { useVault } from "./useVault";

/**
 * Vault performance history, reconstructed entirely from on-chain event logs —
 * no subgraph/indexer. ERC-4626 exposes no historical series on-chain, but the
 * vault's events carry enough to rebuild one:
 *   - Rebalanced(totalAssets, …)  → authoritative TVL snapshots
 *   - Deposit/Withdraw/Fulfilled(assets, shares) → TVL deltas + share mint/burn
 * Walking these in block order yields totalAssets and totalSupply over time, and
 * from them share price (assets/share) and an annualized APY.
 *
 * Bounded getLogs makes this viable on the local fork (deploy block → head is a
 * tiny range); on mainnet the same range would need a real indexer.
 */

const HISTORY_EVENT_NAMES = new Set(["Deposit", "Withdraw", "WithdrawFulfilled", "Rebalanced"]);
const HISTORY_EVENTS = vaultAbi.filter(
  (e) => e.type === "event" && HISTORY_EVENT_NAMES.has((e as { name: string }).name),
) as AbiEvent[];

const BLOCK_WINDOW = 100_000n;
const SECONDS_PER_YEAR = 31_536_000;
// Floor the elapsed window when annualizing so a sub-minute fork window doesn't
// blow a fraction-of-a-percent move up into an astronomical APY. Linear (not
// compounded) annualization for the same reason — stable on short/frozen ranges.
const MIN_ELAPSED_SECONDS = 86_400;
// Cap events processed (newest side) so a long session with thousands of keeper
// rebalances doesn't fan out into thousands of getBlock timestamp lookups.
const MAX_EVENTS = 400;

const DEPLOY_BLOCK: bigint | undefined = (() => {
  const raw = process.env.NEXT_PUBLIC_DEPLOY_BLOCK;
  if (!raw || raw.trim() === "") return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
})();

export interface HistoryPoint {
  block: number;
  /** unix seconds; falls back to block number when a timestamp can't be resolved */
  t: number;
  tvl: number; // human asset units (e.g. USDC)
  sharePrice: number; // assets per share, human
  apy: number; // annualized %, from share-price growth since inception
}

type RawLog = {
  eventName?: string;
  args?: Record<string, unknown>;
  blockNumber: bigint | null;
  logIndex: number | null;
};

export function useVaultHistory() {
  const client = usePublicClient();
  const { data: vault } = useVault();
  const assetDecimals = vault.assetDecimals;
  const shareDecimals = vault.shareDecimals ?? 18;

  const query = useQuery({
    queryKey: ["vault-history", ACTIVE_CHAIN_ID, VAULT_ADDRESS, assetDecimals, shareDecimals],
    enabled: IS_VAULT_CONFIGURED && !!client && !!VAULT_ADDRESS && assetDecimals !== undefined,
    refetchInterval: 30_000,
    queryFn: async (): Promise<HistoryPoint[]> => {
      if (!client || !VAULT_ADDRESS || assetDecimals === undefined) return [];

      const latest = await client.getBlockNumber();
      const windowed = latest > BLOCK_WINDOW ? latest - BLOCK_WINDOW : 0n;
      const fromBlock =
        DEPLOY_BLOCK !== undefined ? (windowed > DEPLOY_BLOCK ? windowed : DEPLOY_BLOCK) : windowed;

      const logs = (await client.getLogs({
        address: VAULT_ADDRESS,
        events: HISTORY_EVENTS,
        fromBlock,
        toBlock: "latest",
      })) as unknown as RawLog[];

      // Ascending by (block, logIndex) so the running totals replay in order.
      let ordered = logs
        .filter((l) => l.blockNumber !== null)
        .sort((a, b) => {
          const ab = a.blockNumber ?? 0n;
          const bb = b.blockNumber ?? 0n;
          if (ab !== bb) return ab > bb ? 1 : -1;
          return (a.logIndex ?? 0) - (b.logIndex ?? 0);
        });
      // Keep the most recent MAX_EVENTS while preserving the running totals: if we
      // drop the head we lose the supply/assets accumulated before it, so instead
      // we only cap when oversized and accept that a very long session starts the
      // curve later. (Deploy→head is small on the fork, so this rarely trips.)
      if (ordered.length > MAX_EVENTS) ordered = ordered.slice(ordered.length - MAX_EVENTS);

      // Resolve timestamps for the unique blocks involved.
      const uniqueBlocks = [...new Set(ordered.map((l) => l.blockNumber as bigint))];
      const blocks = await Promise.all(
        uniqueBlocks.map((bn) => client.getBlock({ blockNumber: bn }).catch(() => undefined)),
      );
      const tsByBlock = new Map<bigint, number>();
      uniqueBlocks.forEach((bn, i) => {
        const ts = blocks[i]?.timestamp;
        if (ts !== undefined) tsByBlock.set(bn, Number(ts));
      });

      const assetScale = 10 ** assetDecimals;
      const shareScale = 10 ** shareDecimals;

      let runningAssets = 0n; // base units
      let runningSupply = 0n; // base units
      const points: HistoryPoint[] = [];

      for (const log of ordered) {
        const name = log.eventName;
        const a = log.args ?? {};
        const assets = (a.assets as bigint | undefined) ?? 0n;
        const shares = (a.shares as bigint | undefined) ?? 0n;

        switch (name) {
          case "Deposit":
            runningAssets += assets;
            runningSupply += shares;
            break;
          case "Withdraw":
          case "WithdrawFulfilled":
            runningAssets -= assets;
            runningSupply -= shares;
            break;
          case "Rebalanced":
            // Authoritative TVL snapshot (also absorbs harvest/yield drift).
            runningAssets = (a.totalAssets as bigint | undefined) ?? runningAssets;
            break;
        }
        if (runningAssets < 0n) runningAssets = 0n;
        if (runningSupply < 0n) runningSupply = 0n;

        const block = Number(log.blockNumber);
        const tvl = Number(runningAssets) / assetScale;
        const sharePrice =
          runningSupply > 0n ? Number(runningAssets) / assetScale / (Number(runningSupply) / shareScale) : 1;

        points.push({ block, t: tsByBlock.get(log.blockNumber as bigint) ?? block, tvl, sharePrice, apy: 0 });
      }

      // Annualized APY from share-price growth since the first priced point.
      const first = points.find((p) => p.sharePrice > 0);
      if (first) {
        for (const p of points) {
          const elapsed = Math.max(p.t - first.t, 0);
          if (elapsed <= 0 || first.sharePrice <= 0) {
            p.apy = 0;
            continue;
          }
          const growth = p.sharePrice / first.sharePrice - 1;
          p.apy = (growth * SECONDS_PER_YEAR) / Math.max(elapsed, MIN_ELAPSED_SECONDS) * 100;
        }
      }

      return points;
    },
  });

  const points = query.data ?? [];
  return {
    isConfigured: IS_VAULT_CONFIGURED,
    isLoading: query.isLoading,
    isError: query.isError,
    points,
    latest: points.length ? points[points.length - 1] : undefined,
    refetch: query.refetch,
  };
}
