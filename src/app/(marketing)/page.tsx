import Link from "next/link";
import { Hero } from "@/components/marketing/Hero";
import { Pillars } from "@/components/marketing/Pillars";
import { StrategyShowcase } from "@/components/marketing/StrategyShowcase";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Architecture } from "@/components/marketing/Architecture";
import { Integrations } from "@/components/marketing/Integrations";
import { SecurityTeaser } from "@/components/marketing/SecurityTeaser";
import { Section } from "@/components/marketing/Section";
import { Reveal } from "@/components/ui/motion";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Pillars />
      <StrategyShowcase />
      <HowItWorks />
      <Architecture />
      <Integrations />
      <SecurityTeaser />

      {/* Closing CTA */}
      <Section className="band-raised border-t-2 border-ink">
        <Reveal>
          <div className="relative overflow-hidden px-6 py-14 text-center sm:px-10">
            <h2 className="display mx-auto max-w-2xl text-3xl text-fg sm:text-5xl">
              Put idle USDC to work — without giving up control.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm text-fg-muted sm:text-base">
              Connect a wallet to review live allocation, caps and the withdrawal queue. Deposits open once the vault
              is deployed.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/app" className="btn-primary px-6 py-3 text-base">
                Launch App <span aria-hidden>→</span>
              </Link>
              <Link href="/docs" className="btn-ghost px-6 py-3 text-base">
                Read the docs
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
