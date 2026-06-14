"use client";

import { useState } from "react";
import Link from "next/link";
import { VAULT_ADDRESS, IS_VAULT_CONFIGURED, ACTIVE_CHAIN, EXPLORER_URL, HAS_EXPLORER } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";

/**
 * Institutional trust strip: the vault's on-chain identity (copyable address +
 * explorer link), chain, routing attribution, and a plain-language disclaimer.
 */
const ROUTES = [
  { label: "Aave V3", color: "#0F766E" },
  { label: "Morpho", color: "#4338CA" },
  { label: "Pendle", color: "#A21CAF" },
  { label: "Compound V3", color: "#00D395" },
];

const LINKS = [
  { label: "Security", href: "/security" },
  { label: "Docs", href: "/docs" },
  { label: "Transparency", href: "/app/transparency" },
];

export function TrustStrip() {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!VAULT_ADDRESS || !navigator.clipboard) return;
    navigator.clipboard.writeText(VAULT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <footer className="glass-soft mt-auto border-t-2 border-ink">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="overline">Vault contract</span>
          {IS_VAULT_CONFIGURED && VAULT_ADDRESS ? (
            <span className="flex items-center gap-2">
              {HAS_EXPLORER ? (
                <a
                  href={`${EXPLORER_URL}/address/${VAULT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="num-mono text-fg hover:text-accent"
                >
                  {shortAddress(VAULT_ADDRESS, 10, 8)}
                </a>
              ) : (
                <span className="num-mono text-fg">{shortAddress(VAULT_ADDRESS, 10, 8)}</span>
              )}
              <button onClick={copy} className="text-2xs text-fg-faint hover:text-accent" title="Copy address">
                {copied ? "copied ✓" : "copy"}
              </button>
            </span>
          ) : (
            <span className="num-mono text-fg-faint">not deployed</span>
          )}
          <span className="text-fg-faint">·</span>
          <span className="text-fg-muted">{ACTIVE_CHAIN.name}</span>
          <span className="tag border-line-strong text-fg-muted">ERC-4626</span>
          <span className="tag border-line-strong text-fg-muted">EIP-2535</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="overline">Routes via</span>
          <div className="flex items-center gap-3">
            {ROUTES.map((r) => (
              <span key={r.label} className="flex items-center gap-1.5 text-fg-muted">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-3xl text-2xs leading-relaxed text-fg-faint">
          Non-custodial ERC-4626 vault on an EIP-2535 diamond. Yields are variable and not guaranteed; deposited
          capital is subject to smart-contract and market risk. Audits pending — verify the contract on the block
          explorer before depositing. Informational only; not investment advice.
        </p>
        <div className="flex shrink-0 items-center gap-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-2xs text-fg-muted hover:text-accent">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
