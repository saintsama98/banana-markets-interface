"use client";

import Link from "next/link";

const STRATEGIES = [
  {
    slug: "aave-usdc",
    venue: "Aave V3",
    color: "#0F766E",
    glyph: "△",
    kind: "Variable lending",
    blurb:
      "USDC supplied to Aave V3. Yield auto-accrues via aToken rebasing; deep liquidity and a battle-tested risk framework make this the conservative core.",
    params: ["Supply APY", "Utilization-driven", "Instant liquidity"],
  },
  {
    slug: "morpho-usdc",
    venue: "Morpho",
    color: "#4338CA",
    glyph: "◇",
    kind: "Curated lending",
    blurb:
      "Deposits into curated MetaMorpho markets with per-market supply caps and isolated collateral. Higher rates, governed by absolute and relative caps.",
    params: ["Native + rewards APY", "Per-market caps", "Isolated risk"],
  },
  {
    slug: "pendle-usdc",
    venue: "Pendle PT",
    color: "#A21CAF",
    glyph: "◎",
    kind: "Fixed yield",
    blurb:
      "Principal Tokens held to maturity for a fixed, known yield. Oracle-priced, time-bound exposure that locks in rate certainty for a slice of the book.",
    params: ["Fixed APY", "Maturity-dated", "Oracle-priced"],
  },
  {
    slug: "compound-usdc",
    venue: "Compound V3",
    color: "#00D395",
    glyph: "◈",
    kind: "Variable lending",
    blurb:
      "USDC supplied to the Compound III (Comet) base market. The supply rate floats with utilization and accrues every block — a deep, single-asset lending venue alongside the variable-rate core.",
    params: ["Supply APY", "Utilization-driven", "Instant liquidity"],
  },
];

/** Venue cards in a contained grid — consistent boxes, nothing overflows. */
export function StrategyShowcase() {
  return (
    <section id="strategies" className="band relative">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="legible -ml-[1.1rem] -mt-[0.5rem] max-w-2xl">
          <div className="overline text-accent-strong">Modular by design</div>
          <h2 className="display mt-3 text-3xl text-fg sm:text-5xl">Four strategies, one share price</h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
            Each venue is a self-contained, capped module behind a single ERC-4626 share. The keeper rebalances toward
            curator-set targets; you hold one position with blended, risk-gated exposure.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STRATEGIES.map((s) => (
            <Link
              key={s.slug}
              href={`/app/strategies/${s.slug}`}
              className="showcase-card panel group flex h-full flex-col p-6 transition-transform duration-150 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink text-lg"
                  style={{ color: s.color, background: `${s.color}14` }}
                >
                  {s.glyph}
                </span>
                <span className="overline">{s.kind}</span>
              </div>
              <h3 className="display mt-5 text-xl text-fg sm:text-2xl">{s.venue}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{s.blurb}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {s.params.map((p) => (
                  <li key={p} className="tag bg-surface-2 text-fg-muted">
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1 font-display text-sm font-bold text-accent-strong">
                View strategy
                <span className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/app/strategies"
            className="font-display text-sm font-bold text-fg underline decoration-2 underline-offset-4 hover:text-accent-strong"
          >
            Compare all strategies →
          </Link>
        </div>
      </div>
    </section>
  );
}
