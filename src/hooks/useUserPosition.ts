"use client";

import { useAccount, useReadContracts } from "wagmi";
import { vaultAbi, erc20Abi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";

const vault = { address: VAULT_ADDRESS, abi: vaultAbi } as const;

/**
 * The connected wallet's position: vault shares, their asset value, wallet USDC
 * balance + allowance to the vault, and share-lock expiry. `assetAddress` is
 * passed in (read once at the page level) to build the ERC-20 reads.
 */
export function useUserPosition(assetAddress?: `0x${string}`) {
  const { address, isConnected } = useAccount();

  const query = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...vault, functionName: "balanceOf", args: address ? [address] : undefined },
      { ...vault, functionName: "maxWithdraw", args: address ? [address] : undefined },
      { ...vault, functionName: "lockedUntil", args: address ? [address] : undefined },
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: address && VAULT_ADDRESS ? [address, VAULT_ADDRESS] : undefined,
      },
    ],
    query: {
      enabled: IS_VAULT_CONFIGURED && isConnected && !!address && !!assetAddress,
      refetchInterval: 15_000,
    },
  });

  const val = <T,>(i: number): T | undefined =>
    query.data?.[i]?.status === "success" ? (query.data[i].result as T) : undefined;

  return {
    isConnected,
    isLoading: query.isLoading,
    refetch: query.refetch,
    shares: val<bigint>(0),
    /**
     * ERC-4626 maxWithdraw: the asset value of the user's full share balance.
     * NOT capped by vault idle liquidity — the synchronous withdraw() is only
     * backed by idle USDC, so callers must cap by vault.idleAssets for the
     * true instantly-withdrawable amount.
     */
    maxWithdrawAssets: val<bigint>(1),
    lockedUntil: val<bigint>(2),
    walletAssetBalance: val<bigint>(3),
    allowance: val<bigint>(4),
  };
}
