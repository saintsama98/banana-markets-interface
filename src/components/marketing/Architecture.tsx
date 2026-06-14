"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

const FACETS = [
  { name: "ERC-4626 Vault", desc: "deposit / withdraw / shares" },
  { name: "Strategy Router", desc: "allocate / rebalance / harvest" },
  { name: "Withdrawal Queue", desc: "async request / fulfill" },
  { name: "Risk & Admin", desc: "caps / fees / circuit breaker" },
  { name: "Access Control", desc: "owner / curator (ERC-173)" },
];

const VENUES = [
  { name: "Aave V3", color: "#0F766E" },
  { name: "Morpho", color: "#4338CA" },
  { name: "Pendle PT", color: "#A21CAF" },
  { name: "Compound V3", color: "#00D395" },
];

/**
 * The diamond diagram assembles once when it enters the viewport — depositors
 * land, capital flows down the connectors, facets stagger in, venues pop,
 * keeper column attaches. No pinning; the page keeps scrolling naturally.
 */
export function Architecture() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: ".arch-diagram", start: "top 70%", once: true },
        });
        tl.from(".arch-depositors", { y: -20, opacity: 0, duration: 0.4 })
          .from(".arch-flow-1", { scaleY: 0, duration: 0.25, ease: "none" })
          .from(".arch-diamond", { opacity: 0, scale: 0.97, duration: 0.4 })
          .from(".arch-facet", { y: 16, opacity: 0, stagger: 0.08, duration: 0.3 })
          .from(".arch-flow-2", { scaleY: 0, duration: 0.25, ease: "none" })
          .from(".arch-venue", { y: 16, opacity: 0, stagger: 0.1, duration: 0.3 })
          .from(".arch-keeper", { x: 28, opacity: 0, duration: 0.45 }, "-=0.2");
      });
    },
    { scope: root },
  );

  return (
    <section id="architecture" ref={root} className="band-raised relative border-y-2 border-ink">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="legible -ml-[1.1rem] -mt-[0.5rem] max-w-3xl">
          <div className="overline text-accent-strong">Under the hood</div>
          <h2 className="display mt-3 text-3xl text-fg sm:text-5xl">A diamond that routes capital</h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
            A single upgradeable EIP-2535 diamond presents one ERC-4626 surface. Facets isolate concerns; EIP-7201
            namespaced storage keeps them collision-free. An off-chain keeper drives routine operations — every move a
            permissioned on-chain transaction anyone can observe.
          </p>
        </div>

        <div className="arch-diagram mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          {/* On-chain column */}
          <div>
            <div className="arch-depositors panel-2 mx-auto max-w-sm px-4 py-3 text-center">
              <div className="font-display text-sm font-bold text-fg">Depositors</div>
              <div className="num text-2xs text-fg-faint">USDC in · shares out</div>
            </div>

            <div className="flex justify-center py-1.5" aria-hidden>
              <div className="arch-flow-1 h-8 w-0.5 origin-top bg-accent-strong" />
            </div>

            <div className="arch-diamond panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-fg">Banana Markets Diamond</span>
                <span className="tag bg-accent/25 text-fg">EIP-2535</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FACETS.map((f) => (
                  <div key={f.name} className="arch-facet rounded-md border-2 border-ink bg-surface-1 px-3 py-2 text-left">
                    <div className="font-display text-xs font-bold text-fg">{f.name}</div>
                    <div className="num-mono text-2xs text-fg-faint">{f.desc}</div>
                  </div>
                ))}
              </div>
              <div className="num-mono mt-3 text-2xs text-fg-faint">EIP-7201 namespaced storage · diamond proxy</div>
            </div>

            <div className="flex justify-center py-1.5" aria-hidden>
              <div className="arch-flow-2 h-8 w-0.5 origin-top bg-accent-strong" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VENUES.map((v) => (
                <div key={v.name} className="arch-venue panel-2 px-4 py-3 text-center">
                  <span className="font-display text-sm font-bold" style={{ color: v.color }}>
                    {v.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Off-chain keeper column */}
          <div className="arch-keeper flex flex-col justify-center lg:w-72">
            <div className="rounded-card border-2 border-dashed border-ink bg-surface-1 p-5">
              <span className="tag bg-surface-3 text-fg-muted">Off-chain</span>
              <h3 className="mt-3 font-display text-sm font-bold text-fg">Keeper / agent</h3>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                Reads the same chain state you do, computes risk and target allocations, and submits permissioned
                curator transactions on a schedule.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-fg-muted">
                <li className="flex items-center gap-2">
                  <span className="text-accent-strong">›</span> Rebalance to targets
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-strong">›</span> Harvest & compound
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-strong">›</span> Guard checkpoints
                </li>
              </ul>
              <div className="mt-4 border-t-2 border-ink/20 pt-3 text-2xs text-fg-faint">
                Signs with the curator key → on-chain, observable, overridable.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
