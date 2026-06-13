import { hexToString, type Hex } from "viem";

export type StrategyKey = "aave" | "morpho" | "pendle" | "idle" | "unknown";

export interface StrategyMeta {
  key: StrategyKey;
  label: string;
  /** tailwind color token suffix under `venue.*` */
  colorVar: string;
  /** hex used for charts / inline styles */
  color: string;
  blurb: string;
}

/** Rich per-strategy config that backs the dedicated /app/strategies/[slug] pages. */
export interface StrategyConfig extends StrategyMeta {
  /** url slug, e.g. "aave-usdc" */
  slug: string;
  /** venue display name, e.g. "Aave V3" */
  venue: string;
  /** one-word category, e.g. "Variable lending" */
  kind: string;
  glyph: string;
  /** label for the headline yield figure on the detail page */
  apyLabel: string;
  /** venue-specific risk parameters (static descriptors; live values come from chain where exposed) */
  riskParams: { label: string; value: string; hint?: string }[];
  /** contract / oracle disclosure rows (addresses filled post-deploy) */
  contracts: { label: string; value: string }[];
  /** substring matched against the decoded on-chain bytes32 id */
  match: string;
  docsHref?: string;
}

export const STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    slug: "aave-usdc",
    key: "aave",
    venue: "Aave V3",
    kind: "Variable lending",
    glyph: "△",
    colorVar: "venue-aave",
    color: "#0F766E",
    label: "Aave V3",
    apyLabel: "Supply APY",
    blurb:
      "USDC supplied to the Aave V3 market on Arbitrum. Yield accrues continuously via aToken rebasing, driven by pool utilization. The deepest, most battle-tested liquidity venue — the conservative core of the book.",
    riskParams: [
      { label: "Mechanism", value: "Variable supply rate" },
      { label: "Liquidity", value: "Instant (utilization-bound)", hint: "Withdrawable while the pool has free liquidity" },
      { label: "Rate driver", value: "Pool utilization" },
      { label: "Reserve factor", value: "set by Aave governance" },
    ],
    contracts: [
      { label: "Aave V3 Pool", value: "set on deploy" },
      { label: "aUSDC token", value: "set on deploy" },
      { label: "Price oracle", value: "Aave / Chainlink" },
    ],
    match: "aave",
  },
  {
    slug: "morpho-usdc",
    key: "morpho",
    venue: "Morpho",
    kind: "Curated lending",
    glyph: "◇",
    colorVar: "venue-morpho",
    color: "#4338CA",
    label: "Morpho",
    apyLabel: "Net APY",
    blurb:
      "Deposits into curated MetaMorpho markets with isolated collateral and per-market supply caps. Net APY blends native supply yield and rewards, minus fees. Higher rate than the base pool, bounded by absolute and relative caps.",
    riskParams: [
      { label: "Mechanism", value: "Curated isolated markets" },
      { label: "Caps", value: "Absolute + relative per market" },
      { label: "Collateral", value: "Isolated (LLTV-bound)", hint: "Each market has its own liquidation LTV" },
      { label: "Oracle", value: "Per-market oracle" },
    ],
    contracts: [
      { label: "Morpho vault", value: "set on deploy" },
      { label: "Adapter", value: "set on deploy" },
      { label: "Market oracle", value: "set on deploy" },
    ],
    match: "morpho",
  },
  {
    slug: "pendle-usdc",
    key: "pendle",
    venue: "Pendle PT",
    kind: "Fixed yield",
    glyph: "◎",
    colorVar: "venue-pendle",
    color: "#A21CAF",
    label: "Pendle PT",
    apyLabel: "Fixed APY",
    blurb:
      "Principal Tokens (PT) bought at a discount and held to maturity for a fixed, known yield. Oracle-priced and time-bound — this slice locks in rate certainty independent of floating market rates.",
    riskParams: [
      { label: "Mechanism", value: "PT held to maturity" },
      { label: "Yield", value: "Fixed (locked at entry)" },
      { label: "Maturity", value: "set per market", hint: "PT redeems 1:1 for USDC at maturity" },
      { label: "Pricing", value: "Oracle-priced (pre-maturity)" },
    ],
    contracts: [
      { label: "Pendle market", value: "set on deploy" },
      { label: "PT token", value: "set on deploy" },
      { label: "PT oracle", value: "set on deploy" },
    ],
    match: "pendle",
  },
];

const IDLE_META: StrategyMeta = {
  key: "idle",
  label: "Idle Reserve",
  colorVar: "venue-idle",
  color: "#57534E",
  blurb: "Unallocated USDC held liquid for instant withdrawals.",
};

export function getStrategyConfig(slug: string): StrategyConfig | undefined {
  return STRATEGY_CONFIGS.find((s) => s.slug === slug);
}

/**
 * Resolve a bytes32 strategy id to display metadata.
 *
 * The diamond stores strategy ids as bytes32 — typically a short ASCII label
 * right-padded with zeros (e.g. "aave"). We decode and match against a config;
 * anything unrecognised falls back to a shortened hex label so the UI never
 * breaks on a strategy added after this build.
 */
export function resolveStrategy(id: Hex): StrategyMeta {
  let decoded = "";
  try {
    decoded = hexToString(id, { size: 32 }).replace(/ +$/g, "").trim().toLowerCase();
  } catch {
    decoded = "";
  }

  if (decoded.includes("idle")) return IDLE_META;
  const cfg = STRATEGY_CONFIGS.find((s) => decoded.includes(s.match));
  if (cfg) return cfg;

  return {
    key: "unknown",
    label: decoded || `${id.slice(0, 10)}…`,
    colorVar: "venue-idle",
    color: "#57534E",
    blurb: "Custom strategy registered on-chain.",
  };
}
