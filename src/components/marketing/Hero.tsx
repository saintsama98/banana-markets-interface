"use client";

import { useRef } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useVault } from "@/hooks/useVault";
import { useAllocations } from "@/hooks/useAllocations";
import { gsap, SplitText, useGSAP } from "./gsap";
import { CountUp } from "./CountUp";

function HeroStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-l-2 border-ink/15 pl-4 text-left first:border-0 first:pl-0 sm:pl-6">
      <div className="overline">{label}</div>
      <div className="num mt-1 text-2xl font-semibold text-fg sm:text-3xl">{children}</div>
    </div>
  );
}

/**
 * Full-viewport hero: liquidity-routing canvas behind, SplitText word-by-word
 * headline, count-up stat band. No pinning — the page scrolls naturally.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { data, isConfigured } = useVault();
  const alloc = useAllocations();

  const tvl =
    isConfigured && data.totalAssets !== undefined
      ? Number(formatUnits(data.totalAssets, data.assetDecimals))
      : undefined;
  const strategyCount = alloc.rows.length || 3;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = new SplitText(".hero-headline", { type: "words" });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(split.words, { yPercent: 110, opacity: 0, duration: 0.7, stagger: 0.055 })
          .from(".hero-eyebrow", { y: -12, opacity: 0, duration: 0.45 }, "-=0.55")
          .from(".hero-sub", { y: 20, opacity: 0, duration: 0.55 }, "-=0.35")
          .from(".hero-cta", { y: 14, opacity: 0, duration: 0.4, stagger: 0.07 }, "-=0.3")
          .from(".hero-stats", { y: 22, opacity: 0, duration: 0.55 }, "-=0.25");

        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="band relative flex min-h-[92svh] items-center overflow-hidden">
      {/* legibility scrim (the liquidity-routing scene was removed in favor of the 3D crystal backdrop) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(255,204,41,0.92),rgba(255,204,41,0.55)_60%,transparent)]" />

      <div className="hero-content relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-20 text-center sm:px-10">
        <span className="hero-eyebrow tag bg-surface-1 text-fg">ERC-4626 · EIP-2535 Diamond · Arbitrum</span>

        <h1 className="hero-headline display mt-6 text-balance text-5xl leading-[1.02] text-fg sm:text-7xl">
          Institutional USDC yield, routed with discipline.
        </h1>

        <p className="hero-sub mt-7 max-w-2xl text-pretty text-base leading-relaxed text-fg-muted sm:text-lg">
          Banana Markets allocates deposits across Aave, Morpho and Pendle under an on-chain risk model — per-strategy
          caps, an idle reserve for instant exits, share-price circuit breakers, and a curator-operated keeper.
          Transparent by construction.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href="/app" className="hero-cta btn-primary px-6 py-3 text-base">
            Launch App <span aria-hidden>→</span>
          </Link>
          <Link href="/#architecture" className="hero-cta btn-ghost px-6 py-3 text-base">
            How it works
          </Link>
        </div>

        {/* Live stat band — counts up on entry */}
        <div className="hero-stats panel mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-8 px-6 py-6 sm:grid-cols-4">
          <HeroStat label="Total value locked">
            {tvl !== undefined ? (
              <CountUp
                value={tvl}
                format={(n) =>
                  "$" + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n)
                }
              />
            ) : (
              <span className="text-fg-faint">—</span>
            )}
          </HeroStat>
          <HeroStat label="Strategies">
            <CountUp value={strategyCount} format={(n) => Math.round(n).toString()} />
          </HeroStat>
          <HeroStat label="Net APY">
            <span className="text-fg-faint" title="Realized APY is available once the vault has share-price history">
              —
            </span>
          </HeroStat>
          <HeroStat label="Asset">
            <span className="text-accent-strong">USDC</span>
          </HeroStat>
        </div>
      </div>

      {/* scroll cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <span className="overline">Scroll</span>
      </div>
    </section>
  );
}
