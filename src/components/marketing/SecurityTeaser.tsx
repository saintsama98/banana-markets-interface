import Link from "next/link";
import { Section } from "./Section";
import { Reveal } from "@/components/ui/motion";

const ITEMS = [
  { title: "Independent audits", body: "Facet-by-facet review by external firms before mainnet.", tag: "TODO links" },
  { title: "Formal verification", body: "Invariants on share price, accounting and access control.", tag: "Planned" },
  { title: "Bug bounty", body: "Continuous responsible-disclosure program for the contracts.", tag: "Planned" },
  { title: "Circuit breaker", body: "Share-price delta guard + owner pause halt deposits on anomaly.", tag: "Live" },
];

export function SecurityTeaser() {
  return (
    <Section id="security-teaser">
      <Reveal>
        <div className="panel p-6 sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <div className="overline text-accent-strong">Security first</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                Open by default, secure by design
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The contracts are non-custodial and permission-scoped. Risk parameters, fees and ownership transitions
                are all on-chain and two-step where it matters. Full audit reports, the bug-bounty program and the
                contract registry live on the security page.
              </p>
              <Link href="/security" className="btn-ghost mt-6 px-4 py-2">
                View security & audits <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ITEMS.map((it) => (
                <div key={it.title} className="panel-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg">{it.title}</span>
                    <span className="tag border-line-strong text-fg-faint">{it.tag}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
