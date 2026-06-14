"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { vaultAbi, erc20Abi } from "@/abi/vault";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED, TX_PASSCODE, ACTIVE_CHAIN, ACTIVE_CHAIN_ID } from "@/lib/contracts";
import { useVault } from "@/hooks/useVault";
import { useUserPosition } from "@/hooks/useUserPosition";
import { cx } from "@/components/ui/primitives";
import { formatAmount } from "@/lib/format";
import { TxConfirmModal, type TxStage } from "./TxConfirmModal";

type Tab = "deposit" | "withdraw" | "request";

const TABS: { key: Tab; label: string }[] = [
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "request", label: "Request exit" },
];

// Communicated worst-case cooldown for an async exit. Fulfillment is actually
// liquidity-driven (usually fast); this is the upper bound surfaced to the user,
// in line with risk-managed redemption windows used by comparable protocols.
const COOLDOWN_ESTIMATE = "up to 7 days";

export function DepositCard() {
  const { isConnected, address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: vault } = useVault();
  const pos = useUserPosition(vault.assetAddress);

  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");

  // Transaction-PIN confirmation gate (see TxConfirmModal).
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  // Async-exit (Request exit) flow: terms acknowledgement before the cooldown step.
  const [termsAgreed, setTermsAgreed] = useState(false);

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

  // Instant-withdrawal cap: at most INSTANT_WITHDRAW_PCT of the user's own
  // position per transaction — larger exits must route through Request exit.
  const INSTANT_WITHDRAW_PCT = 25n;
  const perTxCap: bigint | undefined =
    pos.maxWithdrawAssets !== undefined ? (pos.maxWithdrawAssets * INSTANT_WITHDRAW_PCT) / 100n : undefined;

  // Instant withdraw is also backed only by the vault's idle USDC (the
  // synchronous withdraw() reverts above that), so the effective cap is
  // min(25%-of-position, vault idle).
  const instantWithdrawMax: bigint | undefined =
    perTxCap !== undefined && vault.idleAssets !== undefined
      ? perTxCap < vault.idleAssets
        ? perTxCap
        : vault.idleAssets
      : perTxCap ?? vault.idleAssets;

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

  // One-time ERC-20 approval — a setup tx (no funds move), so it skips the PIN.
  function executeApprove() {
    if (!VAULT_ADDRESS || !vault.assetAddress) return;
    reset();
    writeContract({ address: vault.assetAddress, abi: erc20Abi, functionName: "approve", args: [VAULT_ADDRESS, maxUint256] });
  }

  // The value-moving action — fired only after the transaction PIN is accepted.
  function executeTx() {
    if (parsedAmount === undefined || !VAULT_ADDRESS) return;
    reset();
    if (tab === "deposit") {
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "deposit", args: [parsedAmount, receiver()] });
    } else if (tab === "withdraw") {
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "withdraw", args: [parsedAmount, receiver(), receiver()] });
    } else {
      writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "requestWithdraw", args: [parsedAmount, receiver()] });
    }
  }

  const isCooldownFlow = tab === "request";

  function onCta() {
    if (disabled) return;
    if (needsApproval) {
      executeApprove();
      return;
    }
    setPinError(null);
    setAuthorized(false);
    setTermsAgreed(false);
    setConfirmOpen(true);
  }

  // Standard (deposit / instant withdraw) — PIN authorizes the tx.
  function onSubmitPin(pin: string) {
    if (pin === TX_PASSCODE) {
      setPinError(null);
      setAuthorized(true);
      executeTx();
    } else {
      setPinError("Incorrect PIN. Try again.");
    }
  }

  // Async exit — terms acknowledged → advance to the cooldown step.
  function onAgreeTerms() {
    setTermsAgreed(true);
  }

  // Async exit — starting the cooldown queues the request on-chain.
  function onStartCooldown() {
    setAuthorized(true);
    executeTx();
  }

  function closeConfirm() {
    if (isMined) setAmount("");
    setConfirmOpen(false);
    setAuthorized(false);
    setTermsAgreed(false);
    setPinError(null);
    reset();
  }

  function retryTx() {
    reset();
    executeTx();
  }

  // Pre-authorization phase differs by flow: deposit/withdraw → PIN; request →
  // terms then cooldown. After authorization both share the wagmi-driven stages.
  const confirmStage: TxStage = !authorized
    ? isCooldownFlow
      ? termsAgreed
        ? "cooldown"
        : "terms"
      : "pin"
    : error
      ? "error"
      : isMined
        ? "success"
        : isMining
          ? "mining"
          : "wallet";

  const actionLabel = tab === "deposit" ? "Deposit" : tab === "withdraw" ? "Withdraw" : "Request exit";
  const amountLabel = `${amount || "0"} ${tab === "request" ? vault.symbol ?? "shares" : "USDC"}`;

  // Asset/network readiness gate: the vault settles in USDC on a specific chain
  // (Arbitrum One in production). Surface a notice when the wallet is on the
  // wrong network, or holds no USDC on the active chain, so the user knows to
  // fund/bridge before depositing.
  const wrongNetwork = isConnected && chainId !== undefined && chainId !== ACTIVE_CHAIN_ID;
  const noUnderlying = isConnected && !wrongNetwork && pos.walletAssetBalance === 0n;
  const showAssetGate = wrongNetwork || (tab === "deposit" && noUnderlying);
  const isArbitrum = ACTIVE_CHAIN_ID === 42161;

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
                setConfirmOpen(false);
                setAuthorized(false);
                setTermsAgreed(false);
                setPinError(null);
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
        {showAssetGate && (
          <div className="rounded-card border-2 border-ink bg-warning/20 px-4 py-3.5">
            {wrongNetwork ? (
              <>
                <p className="font-display text-sm font-bold text-fg">Wrong network</p>
                <p className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  This vault runs on <span className="text-fg">{ACTIVE_CHAIN.name}</span>. Switch your wallet network to
                  deposit or withdraw.
                </p>
                {switchChain && (
                  <button
                    onClick={() => switchChain({ chainId: ACTIVE_CHAIN_ID })}
                    className="btn-primary mt-3 w-full py-2.5 text-sm"
                  >
                    Switch to {ACTIVE_CHAIN.name}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-sm font-bold text-fg">You need USDC on {ACTIVE_CHAIN.name}</p>
                <p className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  Deposits settle in USDC. Your wallet holds no USDC on {ACTIVE_CHAIN.name} — fund or bridge it in
                  first, then deposit into the vault.
                </p>
                {isArbitrum && (
                  <a
                    href="https://bridge.arbitrum.io"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-display text-sm font-bold text-accent-strong hover:underline"
                  >
                    Bridge USDC to Arbitrum <span aria-hidden>→</span>
                  </a>
                )}
              </>
            )}
          </div>
        )}

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
            "Instant withdrawals are capped at 25% of your position per transaction (and by the vault's idle liquidity). To exit more, use Request exit."}
          {tab === "request" && "Queues shares for the curator/keeper to fulfill once liquidity frees. Priced at fulfillment — you keep full exposure until then."}
        </p>

        <button onClick={onCta} disabled={disabled} className="btn-primary w-full py-3.5 text-base">
          {!isConnected ? "Connect wallet to continue" : ctaLabel}
        </button>

        {needsApproval && !isPending && !isMining && (
          <p className="text-center text-2xs text-fg-faint">One-time approval, then press Deposit again.</p>
        )}
        {/* Inline feedback covers the approval step; the value action's result is
            shown inside the confirm modal instead (gated on !authorized). */}
        {isMined && !authorized && (
          <p className="num text-center text-2xs text-up">
            ✓ Confirmed. {tab === "deposit" ? "Shares minted." : tab === "withdraw" ? "Assets sent." : "Exit queued."}
          </p>
        )}
        {error && !authorized && (
          <p className="text-center text-2xs text-down">
            {(error as { shortMessage?: string }).shortMessage ?? "Transaction failed."}
          </p>
        )}
      </div>

      <TxConfirmModal
        open={confirmOpen}
        stage={confirmStage}
        actionLabel={actionLabel}
        amountLabel={amountLabel}
        pinError={pinError}
        errorMessage={(error as { shortMessage?: string } | null)?.shortMessage ?? "Transaction failed."}
        cooldownEstimate={isCooldownFlow ? COOLDOWN_ESTIMATE : undefined}
        onSubmitPin={onSubmitPin}
        onAgreeTerms={onAgreeTerms}
        onStartCooldown={onStartCooldown}
        onRetry={retryTx}
        onClose={closeConfirm}
      />
    </div>
  );
}
