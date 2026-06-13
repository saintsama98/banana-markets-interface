"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import type { Hex } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";

const base = { address: VAULT_ADDRESS, abi: vaultAbi } as const;

/** How many recent request ids to scan for the connected user's pending exits. */
const SCAN_WINDOW = 50;

export interface WithdrawRequestRow {
  id: bigint;
  owner: Hex;
  receiver: Hex;
  shares: bigint;
  isMine: boolean;
}

/**
 * Async withdrawal queue. Reads queue totals, then scans the most recent
 * SCAN_WINDOW request ids and decodes each. Empty slots (shares == 0) are dropped.
 *
 * NOTE: this is a bounded client-side scan suitable for a skeleton / low volume.
 * At scale, back this with an indexer or the WithdrawRequested/Fulfilled events.
 */
export function useWithdrawQueue() {
  const { address } = useAccount();

  const headQuery = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "nextWithdrawRequestId" },
      { ...base, functionName: "pendingWithdrawShares" },
    ],
    query: { enabled: IS_VAULT_CONFIGURED, refetchInterval: 15_000 },
  });

  const nextId =
    headQuery.data?.[0]?.status === "success" ? (headQuery.data[0].result as bigint) : undefined;
  const pendingShares =
    headQuery.data?.[1]?.status === "success" ? (headQuery.data[1].result as bigint) : undefined;

  // Build the list of ids to scan: [max(0, nextId-window) .. nextId-1].
  const scanIds = useMemo<bigint[]>(() => {
    if (nextId === undefined || nextId === 0n) return [];
    const start = nextId > BigInt(SCAN_WINDOW) ? nextId - BigInt(SCAN_WINDOW) : 0n;
    const out: bigint[] = [];
    for (let i = start; i < nextId; i++) out.push(i);
    return out;
  }, [nextId]);

  const reqQuery = useReadContracts({
    allowFailure: true,
    contracts: scanIds.map((id) => ({ ...base, functionName: "withdrawRequest", args: [id] })),
    query: { enabled: IS_VAULT_CONFIGURED && scanIds.length > 0, refetchInterval: 15_000 },
  });

  const requests = useMemo<WithdrawRequestRow[]>(() => {
    const d = reqQuery.data;
    if (!d) return [];
    const rows: WithdrawRequestRow[] = [];
    scanIds.forEach((id, i) => {
      if (d[i]?.status !== "success") return;
      const r = d[i].result as { owner: Hex; receiver: Hex; shares: bigint };
      if (!r || r.shares === 0n) return; // settled / empty slot
      rows.push({
        id,
        owner: r.owner,
        receiver: r.receiver,
        shares: r.shares,
        isMine: !!address && r.owner.toLowerCase() === address.toLowerCase(),
      });
    });
    return rows.reverse(); // newest first
  }, [reqQuery.data, scanIds, address]);

  return {
    isConfigured: IS_VAULT_CONFIGURED,
    isLoading: headQuery.isLoading || reqQuery.isLoading,
    refetch: () => {
      headQuery.refetch();
      reqQuery.refetch();
    },
    nextId,
    pendingShares,
    requests,
    myRequests: requests.filter((r) => r.isMine),
  };
}
