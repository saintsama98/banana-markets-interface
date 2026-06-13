"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

const PILLARS = [
  {
    stat: "100%",
    label: "Non-custodial",
    body: "Funds live in the vault contract. No off-chain custody; the keeper can only call permissioned, observable functions.",
  },
  {
    stat: "Capped",
    label: "Per-strategy limits",
    body: "Global and per-strategy caps bound exposure to any single venue. Breaches are impossible, not merely discouraged.",
  },
  {
    stat: "On-chain",
    label: "Full transparency",
    body: "Every allocation, rebalance, harvest and fee is an on-chain event — surfaced in-app and verifiable on the explorer.",
  },
  {
    stat: "Instant",
    label: "Idle-reserve exits",
    body: "A liquid reserve is always retained so depositors can withdraw on demand; larger exits queue and fulfill fairly.",
  },
];

/** Cream band: pillars reveal once as they enter — no pinning, natural scroll. */
export function Pillars() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".pillar", {
          y: 36,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="band-raised relative border-y-2 border-ink">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="legible -ml-[1.1rem] -mt-[0.5rem] max-w-2xl">
          <div className="overline text-accent-strong">Why it holds</div>
          <h2 className="display mt-3 text-3xl text-fg sm:text-5xl">Risk discipline, enforced by the contract.</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.label} className="pillar panel p-6">
              <div className="display num text-3xl text-fg sm:text-4xl">{p.stat}</div>
              <div className="mt-3 h-1 w-12 bg-accent-strong" />
              <div className="mt-3 font-display text-base font-bold text-fg">{p.label}</div>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
