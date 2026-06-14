"use client";

import { useAccount, useReadContract } from "wagmi";
import { vaultAbi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useUserPosition } from "@/hooks/useUserPosition";
import { Panel, PanelHeader, Stat, Skeleton } from "@/components/ui/primitives";
import { formatUsd, formatAmount, relativeFromNow } from "@/lib/format";

export function PositionPanel() {
  const { isConnected } = useAccount();
  const { data: vault } = useVault();
  const pos = useUserPosition(vault.assetAddress);

  const valueQuery = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "convertToAssets",
    args: pos.shares !== undefined ? [pos.shares] : undefined,
    query: { enabled: IS_VAULT_CONFIGURED && pos.shares !== undefined && pos.shares > 0n },
  });
  const assetValue = valueQuery.data as bigint | undefined;

  if (!isConnected) {
    return (
      <Panel>
        <PanelHeader title="Your position" />
        <div className="px-5 py-10 text-center text-xs text-fg-faint">Connect a wallet to view your position.</div>
      </Panel>
    );
  }

  const locked = pos.lockedUntil !== undefined && Number(pos.lockedUntil) * 1000 > Date.now();

  // Instant withdraw is capped at 25% of the user's position per transaction
  // (matches DepositCard's INSTANT_WITHDRAW_PCT) and is also backed only by the
  // vault's idle USDC — so what's truly instantly withdrawable is
  // min(25%-of-position, vault idle).
  const INSTANT_WITHDRAW_PCT = 25n;
  const perTxCap: bigint | undefined =
    pos.maxWithdrawAssets !== undefined ? (pos.maxWithdrawAssets * INSTANT_WITHDRAW_PCT) / 100n : undefined;
  const instantlyWithdrawable: bigint | undefined =
    perTxCap !== undefined && vault.idleAssets !== undefined
      ? perTxCap < vault.idleAssets
        ? perTxCap
        : vault.idleAssets
      : perTxCap ?? vault.idleAssets;
  // True when idle liquidity (not the 25% cap) is the binding constraint.
  const idleCapped =
    perTxCap !== undefined && vault.idleAssets !== undefined && perTxCap > vault.idleAssets;

  return (
    <Panel>
      <PanelHeader title="Your position" hint="Shares & value in this vault" />
      <div className="grid grid-cols-2 gap-6 px-5 py-5">
        {pos.isLoading ? (
          <>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </>
        ) : (
          <>
            <Stat label="Position value" value={formatUsd(assetValue, vault.assetDecimals)} accent="matcha" />
            <Stat label="Vault shares" value={formatAmount(pos.shares, vault.shareDecimals ?? 18, { maxFractionDigits: 4 })} sub={vault.symbol} />
            <Stat
              label="Instantly withdrawable"
              value={formatUsd(instantlyWithdrawable, vault.assetDecimals)}
              sub={idleCapped ? "capped by idle — Request exit for more" : "max 25% of position / tx"}
            />
            <Stat
              label="Share lock"
              value={locked ? relativeFromNow(pos.lockedUntil) : "None"}
              accent={locked ? "warning" : undefined}
              sub={locked ? "until transferable" : "transferable"}
            />
          </>
        )}
      </div>
      <div className="border-t border-line px-5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-fg-muted">Wallet USDC</span>
          <span className="num text-fg">{formatUsd(pos.walletAssetBalance, vault.assetDecimals)}</span>
        </div>
      </div>
    </Panel>
  );
}
