import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/marketing/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Docs — Banana Markets",
  description: "Concepts, lifecycle, integration and addresses for the Banana Markets ERC-4626 diamond.",
};

const SECTIONS = [
  {
    group: "Concepts",
    items: [
      { title: "What is Banana Markets", body: "An ERC-4626 vault on an EIP-2535 diamond that routes USDC across Aave, Morpho and Pendle." },
      { title: "Shares & share price", body: "Deposits mint shares; yield accrues into the share price. Redemptions convert shares back to assets." },
      { title: "Risk model", body: "Per-strategy and global caps, an idle reserve, quarantine, and a share-price circuit breaker." },
    ],
  },
  {
    group: "Lifecycle",
    items: [
      { title: "Deposit & withdraw", body: "Instant withdrawals draw on the idle reserve; larger exits queue for keeper fulfillment." },
      { title: "Rebalance & harvest", body: "The keeper allocates toward curator targets and compounds rewards into the share price." },
      { title: "Fees", body: "Performance fee on yield only; management fee on total assets. Both are on-chain and capped." },
    ],
  },
  {
    group: "Build",
    items: [
      { title: "Contract addresses", body: "The diamond and adapter addresses are published in the security registry." },
      { title: "Reading state", body: "All vault state is on-chain: totals, allocation, caps, queue and events via multicall." },
      { title: "Roles", body: "Owner and curator roles gate admin and operations; the keeper signs as curator." },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Section className="pt-20">
        <Reveal>
          <span className="tag bg-accent/25 text-fg">Reference</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-5xl">Documentation</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
            A concise reference for how Banana Markets works on-chain.{" "}
            <span className="text-fg-faint">This is a structured stub — wire each entry to full docs or an MDX page.</span>
          </p>
        </Reveal>
      </Section>

      {SECTIONS.map((s) => (
        <Section key={s.group} className="py-8">
          <SectionHeading eyebrow={s.group} title={s.group} />
          <RevealGroup className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {s.items.map((it) => (
              <RevealItem key={it.title}>
                <div className="h-full panel-2 p-5">
                  <h3 className="text-sm font-semibold text-fg">{it.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">{it.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      ))}

      <Section className="py-10">
        <div className="panel px-6 py-8 text-center">
          <p className="text-sm text-fg-muted">Ready to see it live?</p>
          <Link href="/app" className="btn-primary mt-4 px-5 py-2.5">
            Launch App <span aria-hidden>→</span>
          </Link>
        </div>
      </Section>
    </>
  );
}
