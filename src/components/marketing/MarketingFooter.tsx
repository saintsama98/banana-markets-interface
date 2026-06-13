import Link from "next/link";
import { Brand } from "@/components/shell/Brand";
import { ACTIVE_CHAIN } from "@/lib/contracts";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/app" },
      { label: "Strategies", href: "/app/strategies" },
      { label: "Transparency", href: "/app/transparency" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Security & audits", href: "/security" },
      { label: "Risk model", href: "/security#risk" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "Aave V3", href: "/app/strategies/aave-usdc" },
      { label: "Morpho", href: "/app/strategies/morpho-usdc" },
      { label: "Pendle", href: "/app/strategies/pendle-usdc" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="glass-soft relative border-t-2 border-ink">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Brand href="/" />
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-fg-muted">
            An ERC-4626 router vault that allocates USDC across blue-chip lending and fixed-yield venues under an
            on-chain risk model. Deployed on {ACTIVE_CHAIN.name}.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="overline mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-fg-muted hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-5 py-5 text-2xs text-fg-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {ACTIVE_CHAIN.name} · ERC-4626 · EIP-2535 · Non-custodial</span>
          <span>Yields variable & not guaranteed. Capital at risk. Not investment advice.</span>
        </div>
      </div>
    </footer>
  );
}
