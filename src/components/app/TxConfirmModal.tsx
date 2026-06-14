"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/components/ui/primitives";

/**
 * The visual phase of the confirm flow, derived by the parent.
 * Deposit / instant withdraw: pin → wallet → mining → success/error.
 * Request exit (cooldown flow): terms → cooldown → wallet → mining → success/error.
 */
export type TxStage = "terms" | "cooldown" | "pin" | "wallet" | "mining" | "success" | "error";

interface TxConfirmModalProps {
  open: boolean;
  stage: TxStage;
  actionLabel: string; // "Deposit" | "Withdraw" | "Request exit"
  amountLabel: string; // e.g. "100.00 USDC" / "100.0000 shares"
  pinError?: string | null;
  errorMessage?: string;
  /** When set, this is the async cooldown flow (Request exit) — drives the
   *  terms/cooldown copy and the cooldown headline figure. */
  cooldownEstimate?: string;
  onSubmitPin: (pin: string) => void;
  onAgreeTerms?: () => void;
  onStartCooldown?: () => void;
  onRetry?: () => void;
  onClose: () => void;
}

const PIN_LENGTH = 8;

/**
 * Full-screen, theme-consistent confirmation gate for value-moving actions.
 * Standard actions collect an 8-digit PIN; the async exit walks the user through
 * terms acknowledgement and the withdrawal cooldown before queuing the request.
 */
export function TxConfirmModal({
  open,
  stage,
  actionLabel,
  amountLabel,
  pinError,
  errorMessage,
  cooldownEstimate,
  onSubmitPin,
  onAgreeTerms,
  onStartCooldown,
  onRetry,
  onClose,
}: TxConfirmModalProps) {
  const [pin, setPin] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cooldownFlow = cooldownEstimate !== undefined;

  // Reset the PIN whenever we (re)enter the pin step or the modal reopens.
  useEffect(() => {
    if (open && stage === "pin") {
      setPin("");
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open, stage]);

  // Reset the terms checkbox whenever the modal (re)opens at the terms step.
  useEffect(() => {
    if (open && stage === "terms") setTermsChecked(false);
  }, [open, stage]);

  // Escape closes (a broadcast tx keeps mining in the background).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSubmitPin = pin.length === PIN_LENGTH;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/55 backdrop-blur-sm" />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="glass relative w-full max-w-[440px] overflow-hidden rounded-card border-2 border-ink"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0.16 }}
          >
            <div className="space-y-5 px-6 py-7">
              {/* ---- Phase 1 (async exit): terms & conditions ---- */}
              {stage === "terms" && (
                <>
                  <header className="space-y-1">
                    <p className="overline">Step 1 of 2 · Terms &amp; conditions</p>
                    <p className="font-display text-lg font-bold text-fg">Before you request an exit</p>
                  </header>
                  <ul className="max-h-56 space-y-2.5 overflow-y-auto rounded-card border-2 border-ink bg-canvas px-4 py-3 text-2xs leading-relaxed text-fg-muted">
                    <li>• <span className="text-fg">Requesting an exit queues your shares.</span> No USDC is paid out at this step — your position is reserved for redemption.</li>
                    <li>• <span className="text-fg">Assets are released after a cooldown</span>, once the risk-management desk unwinds positions and recovers liquidity in an orderly way.</li>
                    <li>• <span className="text-fg">You are priced at fulfillment</span> (the share price when the request settles), and you continue earning yield throughout the cooldown.</li>
                    <li>• <span className="text-fg">You may cancel during the cooldown</span> to restore your full position.</li>
                    <li>• Exit value reflects strategy and market conditions at fulfillment; in stressed conditions the cooldown protects remaining depositors and yield expectancy.</li>
                  </ul>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent-strong"
                    />
                    <span className="text-xs text-fg">I have read and agree to the exit terms above.</span>
                  </label>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 py-3">Cancel</button>
                    <button onClick={onAgreeTerms} disabled={!termsChecked} className="btn-primary flex-1 py-3">
                      Agree &amp; continue
                    </button>
                  </div>
                </>
              )}

              {/* ---- Phase 2 (async exit): cooldown explainer ---- */}
              {stage === "cooldown" && (
                <>
                  <header className="space-y-1">
                    <p className="overline">Step 2 of 2 · Withdrawal cooldown</p>
                    <p className="font-display text-lg font-bold text-fg">Understand the cooldown</p>
                  </header>
                  <div className="rounded-card border-2 border-ink bg-canvas px-4 py-4 text-center">
                    <p className="overline">Estimated cooldown</p>
                    <p className="num mt-1 text-3xl text-fg">{cooldownEstimate}</p>
                    <p className="mt-1 text-2xs text-fg-faint">typically hours · extends only when liquidity is constrained</p>
                  </div>
                  <p className="text-2xs leading-relaxed text-fg-muted">
                    For a sizeable exit of underlying assets, the protocol initiates a cooldown so the risk desk can
                    recover liquidity from the strategies without forcing fire-sale unwinds. This is a deliberate
                    protection: it preserves yield expectancy and the share price for everyone, and gives recovery room
                    in complex market conditions. Your shares keep earning during the cooldown, and you can cancel
                    anytime to restore your position.
                  </p>
                  <p className="num text-center text-xs text-fg">Exiting {amountLabel}</p>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 py-3">Cancel</button>
                    <button onClick={onStartCooldown} className="btn-primary flex-1 py-3">Start cooldown period</button>
                  </div>
                </>
              )}

              {/* ---- PIN (deposit / instant withdraw) ---- */}
              {stage === "pin" && (
                <>
                  <header className="space-y-1 text-center">
                    <p className="overline">Confirm {actionLabel.toLowerCase()}</p>
                    <p className="num text-2xl text-fg">{amountLabel}</p>
                  </header>
                  <div className="space-y-2">
                    <label className="overline block text-center" htmlFor="tx-pin">
                      Enter your 8-digit transaction PIN
                    </label>
                    <input
                      id="tx-pin"
                      ref={inputRef}
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={PIN_LENGTH}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, PIN_LENGTH))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSubmitPin) onSubmitPin(pin);
                      }}
                      placeholder="••••••••"
                      className={cx(
                        "num w-full rounded-card border-2 bg-canvas px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-fg outline-none transition-colors duration-150 placeholder:tracking-[0.4em] placeholder:text-fg-faint",
                        pinError ? "border-down" : "border-ink focus:border-accent-strong",
                      )}
                    />
                    {pinError ? (
                      <p className="text-center text-2xs text-down">{pinError}</p>
                    ) : (
                      <p className="text-center text-2xs text-fg-faint">Required to authorize this transaction.</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 py-3">Cancel</button>
                    <button onClick={() => onSubmitPin(pin)} disabled={!canSubmitPin} className="btn-primary flex-1 py-3">
                      Confirm
                    </button>
                  </div>
                </>
              )}

              {(stage === "wallet" || stage === "mining") && (
                <div className="space-y-4 py-2 text-center">
                  <Spinner />
                  <div className="space-y-1">
                    <p className="font-display text-lg font-bold text-fg">
                      {stage === "wallet" ? "Check your wallet" : "Confirming on-chain"}
                    </p>
                    <p className="text-2xs leading-relaxed text-fg-muted">
                      {stage === "wallet"
                        ? `Approve the ${actionLabel.toLowerCase()} of ${amountLabel} in your wallet to continue.`
                        : cooldownFlow
                          ? "Starting your cooldown on-chain — this only takes a moment."
                          : `Your ${actionLabel.toLowerCase()} is being mined — this only takes a moment.`}
                    </p>
                  </div>
                  {stage === "wallet" && (
                    <button onClick={onClose} className="text-2xs text-fg-faint underline-offset-2 hover:text-fg-muted hover:underline">
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {stage === "success" && (
                <div className="space-y-4 py-2 text-center">
                  <Badge tone="up">✓</Badge>
                  <div className="space-y-1">
                    <p className="font-display text-lg font-bold text-fg">
                      {cooldownFlow ? "Cooldown started" : `${actionLabel} confirmed`}
                    </p>
                    <p className="num text-2xs text-up">{amountLabel}</p>
                    {cooldownFlow && (
                      <p className="text-2xs text-fg-faint">Track it in the Withdrawal queue — you can cancel anytime.</p>
                    )}
                  </div>
                  <button onClick={onClose} className="btn-primary w-full py-3">Done</button>
                </div>
              )}

              {stage === "error" && (
                <div className="space-y-4 py-2 text-center">
                  <Badge tone="down">✕</Badge>
                  <div className="space-y-1">
                    <p className="font-display text-lg font-bold text-fg">Transaction failed</p>
                    <p className="text-2xs leading-relaxed text-down">{errorMessage ?? "Something went wrong."}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 py-3">Close</button>
                    {onRetry && (
                      <button onClick={onRetry} className="btn-primary flex-1 py-3">Try again</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Spinner() {
  return <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-accent-strong" />;
}

function Badge({ tone, children }: { tone: "up" | "down"; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        "mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink text-xl font-bold",
        tone === "up" ? "bg-up/20 text-up" : "bg-down/20 text-down",
      )}
    >
      {children}
    </div>
  );
}
