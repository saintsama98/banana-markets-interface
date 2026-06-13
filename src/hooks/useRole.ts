"use client";

import { useAccount, useReadContracts } from "wagmi";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";

const base = { address: VAULT_ADDRESS, abi: vaultAbi } as const;

export type Role = "owner" | "curator" | "user" | "disconnected";

/**
 * Resolve the connected wallet's highest role against the diamond.
 * Owner is implicitly a curator on-chain, but we surface the strongest label.
 */
export function useRole() {
  const { address, isConnected } = useAccount();

  const query = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "owner" },
      { ...base, functionName: "isCurator", args: address ? [address] : undefined },
    ],
    query: {
      enabled: IS_VAULT_CONFIGURED && isConnected && !!address,
      refetchInterval: 30_000,
    },
  });

  const owner = query.data?.[0]?.status === "success" ? (query.data[0].result as `0x${string}`) : undefined;
  const isCurator = query.data?.[1]?.status === "success" ? (query.data[1].result as boolean) : false;

  const isOwner = !!owner && !!address && owner.toLowerCase() === address.toLowerCase();

  let role: Role = "disconnected";
  if (isConnected) {
    if (isOwner) role = "owner";
    else if (isCurator) role = "curator";
    else role = "user";
  }

  return {
    role,
    isOwner,
    isCurator: isCurator || isOwner,
    owner,
    isLoading: query.isLoading,
  };
}
