import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Security & Audits — Banana Markets",
  description: "Audits, bug bounty, formal verification, client-application security and the contract registry.",
};

const AUDITS = [
  { firm: "Audit firm A", scope: "Vault & Strategy facets", status: "TODO" },
  { firm: "Audit firm B", scope: "Withdrawal queue & accounting", status: "TODO" },
  { firm: "Audit firm C", scope: "Diamond proxy & access control", status: "TODO" },
];

const PROTECTIONS = [
  { title: "Circuit breaker", body: "A max share-price-delta guard plus an owner pause halt deposits and routing on anomalous moves.", tag: "Live" },
  { title: "Two-step ownership", body: "Ownership transfers (ERC-173) nominate a pending owner who must accept — no single-tx takeover.", tag: "Live" },
  { title: "Per-strategy caps", body: "Global and per-strategy caps bound exposure; quarantine isolates a degraded venue.", tag: "Live" },
  { title: "Formal verification", body: "Invariants on share price, accounting and access control, machine-checked.", tag: "Planned" },
];

const REGISTRY = [
  { label: "Banana Markets diamond", value: "set on deploy" },
  { label: "Underlying asset (USDC)", value: "set on deploy" },
  { label: "Aave adapter", value: "set on deploy" },
  { label: "Morpho adapter", value: "set on deploy" },
  { label: "Pendle adapter", value: "set on deploy" },
  { label: "Curator / keeper signer", value: "set on deploy" },
];

export default function SecurityPage() {
  return (
    <>
      <Section className="pt-20">
        <Reveal>
          <span className="tag bg-accent/25 text-fg">Trust surface</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-5xl">Security & audits</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
            Banana Markets is non-custodial and permission-scoped. This page is the single source of truth for audit
            reports, the bug-bounty program, on-chain protections and the contract registry.{" "}
            <span className="text-fg-faint">Report links are placeholders pending the audit cycle.</span>
          </p>
        </Reveal>
      </Section>

      <Section id="audits" className="py-10">
        <SectionHeading eyebrow="Independent review" title="Audits" />
        <RevealGroup className="mt-8 overflow-hidden rounded-panel border border-line">
          <div className="grid grid-cols-[1.4fr_1fr_auto] gap-4 border-b border-line bg-surface-1 px-5 py-3 text-2xs uppercase tracking-wide text-fg-faint">
            <span>Firm</span>
            <span>Scope</span>
            <span className="text-right">Report</span>
          </div>
          {AUDITS.map((a) => (
            <RevealItem key={a.firm}>
              <div className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-4 border-b border-line bg-surface-2 px-5 py-3.5 last:border-0">
                <span className="text-sm font-medium text-fg">{a.firm}</span>
                <span className="text-xs text-fg-muted">{a.scope}</span>
                <span className="tag border-line-strong text-fg-faint">{a.status}</span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="mt-3 text-2xs text-fg-faint">
          Replace firm names and link each row to the published PDF once audits complete.
        </p>
      </Section>

      <Section id="risk" className="py-10">
        <SectionHeading eyebrow="By construction" title="On-chain protections" />
        <RevealGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROTECTIONS.map((p) => (
            <RevealItem key={p.title}>
              <div className="h-full panel-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fg">{p.title}</span>
                  <span className={`tag ${p.tag === "Live" ? "bg-up/20 text-fg" : "bg-surface-2 text-fg-muted"}`}>
                    {p.tag}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section id="registry" className="py-10">
        <SectionHeading
          eyebrow="Verify everything"
          title="Contract registry"
          blurb="Every address the vault touches, published for independent verification on the block explorer."
        />
        <RevealGroup className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2">
          {REGISTRY.map((r) => (
            <RevealItem key={r.label} className="bg-surface-2">
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="text-sm text-fg-muted">{r.label}</span>
                <span className="num-mono text-xs text-fg-faint">{r.value}</span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </>
  );
}
