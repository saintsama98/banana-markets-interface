import { Section, SectionHeading } from "./Section";
import { RevealGroup, RevealItem } from "@/components/ui/motion";

const GROUPS: { title: string; items: { name: string; note: string }[] }[] = [
  {
    title: "Routes capital through",
    items: [
      { name: "Aave V3", note: "Variable lending" },
      { name: "Morpho", note: "Curated markets" },
      { name: "Pendle", note: "Fixed yield (PT)" },
      { name: "Compound V3", note: "Variable lending" },
    ],
  },
  {
    title: "Settles on",
    items: [
      { name: "Arbitrum", note: "L2 settlement" },
      { name: "USDC", note: "Reserve asset" },
      { name: "Chainlink", note: "Price oracles" },
    ],
  },
  {
    title: "Built with",
    items: [
      { name: "Foundry", note: "Contracts & tests" },
      { name: "wagmi · viem", note: "On-chain reads/writes" },
      { name: "RainbowKit", note: "Wallet connection" },
    ],
  },
];

export function Integrations() {
  return (
    <Section id="integrations">
      <SectionHeading
        eyebrow="Ecosystem"
        title="Composed from blue-chip primitives"
        blurb="The router doesn't reinvent yield — it allocates to the most battle-tested venues on Arbitrum and exposes the result as one clean ERC-4626 share."
      />
      <RevealGroup className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {GROUPS.map((g) => (
          <RevealItem key={g.title}>
            <div className="h-full panel-2 p-6">
              <div className="overline">{g.title}</div>
              <ul className="mt-4 space-y-3">
                {g.items.map((it) => (
                  <li key={it.name} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-fg">{it.name}</span>
                    <span className="text-2xs text-fg-faint">{it.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
