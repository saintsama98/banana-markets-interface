"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

const STEPS = [
  {
    n: "01",
    title: "Deposit USDC",
    body: "Deposit into the ERC-4626 vault and receive shares at the current price. An idle reserve is always kept liquid for instant withdrawals.",
  },
  {
    n: "02",
    title: "Routed to targets",
    body: "The keeper allocates capital across Aave, Morpho and Pendle toward curator-set targets, respecting per-strategy and global caps.",
  },
  {
    n: "03",
    title: "Yield compounds",
    body: "Each venue accrues yield into the share price. Harvests realize rewards; performance fees apply only to yield, never principal.",
  },
  {
    n: "04",
    title: "Exit on your terms",
    body: "Withdraw instantly against the idle reserve, or queue a larger exit that the keeper fulfills as liquidity frees — priced at fulfillment.",
  },
];

/**
 * Lifecycle: an ink spine fills with matcha as the section scrolls through the
 * viewport (scrub, no pin), while each step reveals once on entry.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hiw-spine", {
          scaleY: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 65%", scrub: 0.5 },
        });
        gsap.utils.toArray<HTMLElement>(".hiw-step").forEach((el) => {
          gsap.from(el, {
            x: -28,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="how" ref={root} className="band relative">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="legible -ml-[1.1rem] -mt-[0.5rem]">
            <div className="overline text-accent-strong">Lifecycle</div>
            <h2 className="display mt-3 text-3xl text-fg sm:text-5xl">How a deposit flows</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
              One position, four stages, fully on-chain. Every step is observable in the app and on the block explorer.
            </p>
          </div>

          <div className="relative pl-12">
            <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-ink/20" aria-hidden />
            <div className="hiw-spine absolute bottom-2 left-4 top-2 w-0.5 origin-top bg-accent-strong" aria-hidden />
            <div className="space-y-10">
              {STEPS.map((s) => (
                <div key={s.n} className="hiw-step panel-2 p-5">
                  <div className="num absolute -left-12 top-5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-canvas text-xs font-bold text-fg">
                    {s.n}
                  </div>
                  <h3 className="font-display text-lg font-bold text-fg sm:text-xl">{s.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
