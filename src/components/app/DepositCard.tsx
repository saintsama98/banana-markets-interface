"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { vaultAbi, erc20Abi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useUserPosition } from "@/hooks/useUserPosition";
import { cx } from "@/components/ui/primitives";
import { formatAmount } from "@/lib/format";

type Tab = "deposit" | "withdraw" | "request";

const TABS: { key: Tab; label: string }[] = [
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "request", label: "Request exit" },
];

export function DepositCard() {
  const { isConnected, address } = useAccount();
  const { data: vault } = useVault();
  const pos = useUserPosition(vault.assetAddress);

  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");

  const assetDecimals = vault.assetDecimals;
  const shareDecimals = vault.shareDecimals ?? 18;
  const decimalsForTab = tab === "request" ? shareDecimals : assetDecimals;

  const parsedAmount = useMemo(() => {
    if (!amount || Number.isNaN(Number(amount))) return undefined;
    try {
      return parseUnits(amount, decimalsForTab);
    } catch {
      return undefined;
    }
  }, [amount, decimalsForTab]);

  const { writeContract, data: txHash, isPending, reset, error } = useWriteContract();
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  // Instant withdraw is backed only by the vault's idle USDC; the synchronous
  // withdraw() reverts above that, so cap by min(user redeemable, vault idle).
  const instantWithdrawMax: bigint | undefined =
    pos.maxWithdrawAssets !== undefined && vault.idleAssets !== undefined
      ? pos.maxWithdrawAssets < vault.idleAssets
        ? pos.maxWithdrawAssets
        : vault.idleAssets
      : pos.maxWithdrawAssets ?? vault.idleAssets;

  // True when the user could redeem more than what's instantly available as idle.
  const idleCapped =
    pos.maxWithdrawAssets !== undefined &&
    vault.idleAssets !== undefined &&
    pos.maxWithdrawAssets > vault.idleAssets;

  const maxForTab: bigint | undefined =
    tab === "deposit" ? pos.walletAssetBalance : tab === "withdraw" ? instantWithdrawMax : pos.shares;

  const needsApproval =
    tab === "deposit" &&
    parsedAmount !== undefined &&
    pos.allowance !== undefined &&
    pos.allowance < parsedAmount;

  const overBalance = parsedAmount !== undefined && maxForTab !== undefined && parsedAmount > maxForTab;

  const disabled =
    !IS_VAULT_CONFIGURED ||
    !isConnected ||
    parsedAmount === undefined ||
    parsedAmount === 0n ||
    overBalance ||
    isPending ||
    isMining;

  function setMax() {
    if (maxForTab === undefined) return;
    setAmount(formatUnits(maxForTab, decimalsForTab));
  }

  function receiver(): `0x${string}` {
    return address as `0x${string}`;
  }

  function submit() {
    if (parsedAmount === undefined || !VAULT_ADDRESS) return;
    reset();
    if (tab === "deposit") {
      if (needsApproval) {
        writeContract({ address: vault.assetAddress!, abi: erc20Abi, functionName: "approve", args: [VAULT_ADDRESS, maxUint256] });
        return;
      }
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "deposit", args: [parsedAmount, receiver()] });
    } else if (tab === "withdraw") {
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "withdraw", args: [parsedAmount, receiver(), receiver()] });
    } else {
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "requestWithdraw", args: [parsedAmount, receiver()] });
    }
  }

  const ctaLabel = isPending
    ? "Confirm in wallet…"
    : isMining
      ? "Mining…"
      : needsApproval
        ? "Approve USDC"
        : tab === "deposit"
          ? "Deposit"
          : tab === "withdraw"
            ? "Withdraw"
            : "Request exit";

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-center border-b border-line px-4 py-4">
        <div className="pill-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setAmount("");
                reset();
              }}
              className={cx("pill-tab", tab === t.key && "text-accent-on")}
            >
              {/* Liquid Glass morph: the active pill glides between tabs */}
              {tab === t.key && (
                <motion.span
                  layoutId="deposit-tab-pill"
                  className="absolute inset-0 rounded-full bg-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.18 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="overline">Amount</span>
            <button
              onClick={setMax}
              disabled={maxForTab === undefined}
              className="font-display text-2xs font-semibold text-fg-muted transition-colors duration-150 hover:text-accent disabled:opacity-40"
            >
              {tab === "request" ? "Shares" : "USDC"} avail:{" "}
              <span className="num text-fg">
                {formatAmount(maxForTab, decimalsForTab, { maxFractionDigits: tab === "request" ? 4 : 2 })}
              </span>{" "}
              · <span className="text-accent-strong">MAX</span>
            </button>
          </div>
          <div
            className={cx(
              "flex items-center gap-3 rounded-card border-2 bg-canvas px-4 py-4 transition-colors duration-150",
              overBalance ? "border-down" : "border-ink focus-within:border-accent-strong",
            )}
          >
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="num w-full bg-transparent text-2xl text-fg outline-none placeholder:text-fg-faint sm:text-3xl"
            />
            <span className="font-display text-sm font-semibold text-fg-muted">
              {tab === "request" ? vault.symbol ?? "shares" : "USDC"}
            </span>
          </div>
          {overBalance && <p className="mt-1.5 text-2xs text-down">Exceeds available balance.</p>}
        </div>

        <p className="text-2xs leading-relaxed text-fg-faint">
          {tab === "deposit" && "Deposits mint vault shares at the current price. Fresh shares may be briefly locked (anti-manipulation)."}
          {tab === "withdraw" &&
            (idleCapped
              ? "Instant withdrawals are capped at the vault's idle liquidity — less than your full redeemable balance. For the remainder, use Request exit."
              : "Instant withdrawals are limited to the vault's idle liquidity. For larger exits, use Request exit.")}
          {tab === "request" && "Queues shares for the curator/keeper to fulfill once liquidity frees. Priced at fulfillment — you keep full exposure until then."}
        </p>

        <button onClick={submit} disabled={disabled} className="btn-primary w-full py-3.5 text-base">
          {!isConnected ? "Connect wallet to continue" : ctaLabel}
        </button>

        {needsApproval && !isPending && !isMining && (
          <p className="text-center text-2xs text-fg-faint">One-time approval, then press Deposit again.</p>
        )}
        {isMined && (
          <p className="num text-center text-2xs text-up">
            ✓ Confirmed. {tab === "deposit" ? "Shares minted." : tab === "withdraw" ? "Assets sent." : "Exit queued."}
          </p>
        )}
        {error && (
          <p className="text-center text-2xs text-down">
            {(error as { shortMessage?: string }).shortMessage ?? "Transaction failed."}
          </p>
        )}
      </div>
    </div>
  );
}
