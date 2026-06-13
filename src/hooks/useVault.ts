"use client";

import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";

const base = { address: VAULT_ADDRESS, abi: vaultAbi } as const;

/**
 * Vault-level state for the overview header and admin panels.
 * One multicall; refetches every 15s.
 */
export function useVault() {
  const query = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "asset" },
      { ...base, functionName: "decimals" },
      { ...base, functionName: "totalAssets" },
      { ...base, functionName: "totalSupply" },
      { ...base, functionName: "idleAssets" },
      { ...base, functionName: "idleReserveBps" },
      { ...base, functionName: "paused" },
      { ...base, functionName: "performanceFeeBps" },
      { ...base, functionName: "managementFeeBps" },
      { ...base, functionName: "feeRecipient" },
      { ...base, functionName: "globalStrategyCap" },
      { ...base, functionName: "maxSharePriceDeltaBps" },
      { ...base, functionName: "name" },
      { ...base, functionName: "symbol" },
    ],
    query: {
      enabled: IS_VAULT_CONFIGURED,
      refetchInterval: 15_000,
    },
  });

  const r = query.data;
  const val = <T,>(i: number): T | undefined =>
    r?.[i]?.status === "success" ? (r[i].result as T) : undefined;

  const assetAddress = val<`0x${string}`>(0);
  const shareDecimals = val<number>(1);
  const totalAssets = val<bigint>(2);
  const totalSupply = val<bigint>(3);

  // Asset decimals: USDC is 6. We read share decimals from chain; the underlying
  // asset's decimals aren't on the vault, so assume 6 (USDC) — the configured asset.
  const assetDecimals = 6;

  // Display-only share price = assets-per-share as a float.
  let sharePrice: number | undefined;
  if (
    totalAssets !== undefined &&
    totalSupply !== undefined &&
    totalSupply > 0n &&
    shareDecimals !== undefined
  ) {
    const a = Number(formatUnits(totalAssets, assetDecimals));
    const s = Number(formatUnits(totalSupply, shareDecimals));
    sharePrice = s > 0 ? a / s : undefined;
  }

  return {
    isConfigured: IS_VAULT_CONFIGURED,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    data: {
      assetAddress,
      assetDecimals,
      shareDecimals,
      totalAssets,
      totalSupply,
      idleAssets: val<bigint>(4),
      idleReserveBps: val<number>(5),
      paused: val<boolean>(6),
      performanceFeeBps: val<number>(7),
      managementFeeBps: val<number>(8),
      feeRecipient: val<`0x${string}`>(9),
      globalStrategyCap: val<number>(10),
      maxSharePriceDeltaBps: val<number>(11),
      name: val<string>(12),
      symbol: val<string>(13),
      sharePrice,
    },
  };
}
