"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import type { Hex } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";
import { resolveStrategy, type StrategyMeta } from "@/lib/strategies";

const base = { address: VAULT_ADDRESS, abi: vaultAbi } as const;

export interface StrategyRow {
  id: Hex;
  meta: StrategyMeta;
  targetBps?: number;
  assets?: bigint;
  capBps?: number;
  quarantined?: boolean;
  /**
   * Share of total vault assets (TVL), 0..1. Uses the SAME denominator as
   * targetBps (which is a fraction of TVL), so live and target are directly
   * comparable — a strategy on its target reads as ~0 drift. (Dividing by the
   * summed *deployed* assets instead would inflate every venue and show
   * permanent fake drift, since only part of TVL is ever deployed.)
   */
  liveFraction: number;
}

/**
 * Full allocation table: list of strategy ids, then per-strategy target / assets /
 * cap / quarantine state batched into one multicall.
 */
export function useAllocations() {
  const idsQuery = useReadContract({
    ...base,
    functionName: "strategies",
    query: { enabled: IS_VAULT_CONFIGURED, refetchInterval: 30_000 },
  });

  const ids = (idsQuery.data as Hex[] | undefined) ?? [];

  // TVL — the denominator for liveFraction, matching how targetBps is defined.
  const totalAssetsQuery = useReadContract({
    ...base,
    functionName: "totalAssets",
    query: { enabled: IS_VAULT_CONFIGURED, refetchInterval: 15_000 },
  });
  const totalAssets = totalAssetsQuery.data as bigint | undefined;

  const detailQuery = useReadContracts({
    allowFailure: true,
    contracts: ids.flatMap((id) => [
      { ...base, functionName: "targetAllocation", args: [id] },
      { ...base, functionName: "strategyTotalAssets", args: [id] },
      { ...base, functionName: "strategyCap", args: [id] },
      { ...base, functionName: "isQuarantined", args: [id] },
    ]),
    query: { enabled: IS_VAULT_CONFIGURED && ids.length > 0, refetchInterval: 15_000 },
  });

  const rows = useMemo<StrategyRow[]>(() => {
    const d = detailQuery.data;
    const get = <T,>(i: number): T | undefined =>
      d?.[i]?.status === "success" ? (d[i].result as T) : undefined;

    const raw = ids.map((id, idx) => {
      const o = idx * 4;
      return {
        id,
        meta: resolveStrategy(id),
        targetBps: get<number>(o + 0),
        assets: get<bigint>(o + 1),
        capBps: get<number>(o + 2),
        quarantined: get<boolean>(o + 3),
        liveFraction: 0,
      } satisfies StrategyRow;
    });

    // Denominator is TVL (totalAssets), not the summed deployed assets, so a
    // strategy holding exactly its targetBps share of TVL reads as ~0 drift.
    if (totalAssets && totalAssets > 0n) {
      for (const r of raw) {
        r.liveFraction = Number(((r.assets ?? 0n) * 10_000n) / totalAssets) / 10_000;
      }
    }
    return raw;
  }, [ids, detailQuery.data, totalAssets]);

  return {
    isConfigured: IS_VAULT_CONFIGURED,
    isLoading: idsQuery.isLoading || detailQuery.isLoading,
    isError: idsQuery.isError || detailQuery.isError,
    refetch: () => {
      idsQuery.refetch();
      detailQuery.refetch();
    },
    ids,
    rows,
  };
}
