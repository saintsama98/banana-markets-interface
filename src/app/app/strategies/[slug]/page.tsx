import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STRATEGY_CONFIGS, getStrategyConfig } from "@/lib/strategies";
import { StrategyDetail } from "@/components/app/StrategyDetail";

export function generateStaticParams() {
  return STRATEGY_CONFIGS.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cfg = getStrategyConfig(params.slug);
  if (!cfg) return { title: "Strategy — Banana Markets" };
  return {
    title: `${cfg.venue} — Banana Markets`,
    description: cfg.blurb,
  };
}

export default function StrategyPage({ params }: { params: { slug: string } }) {
  const cfg = getStrategyConfig(params.slug);
  if (!cfg) notFound();
  return <StrategyDetail config={cfg} />;
}
