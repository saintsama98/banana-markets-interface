import { formatUnits } from "viem";

/** Format a token amount (bigint base units) to a human string with grouping. */
export function formatAmount(
  value: bigint | undefined,
  decimals: number,
  opts: { maxFractionDigits?: number; minFractionDigits?: number } = {},
): string {
  if (value === undefined) return "—";
  const { maxFractionDigits = 2, minFractionDigits = 2 } = opts;
  const asNumber = Number(formatUnits(value, decimals));
  return asNumber.toLocaleString("en-US", {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Format a USDC amount with a leading $ (USDC = 6 decimals by convention). */
export function formatUsd(value: bigint | undefined, decimals = 6, maxFractionDigits = 2): string {
  if (value === undefined) return "—";
  return "$" + formatAmount(value, decimals, { maxFractionDigits, minFractionDigits: 2 });
}

/** Compact USD for big headline numbers: $4.18M, $912.4K. */
export function formatUsdCompact(value: bigint | undefined, decimals = 6): string {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, decimals));
  const fmt = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  });
  return "$" + fmt.format(n);
}

/** Basis points (uint16) -> percentage string, e.g. 4000 -> "40.00%". */
export function bpsToPct(bps: number | bigint | undefined, fractionDigits = 2): string {
  if (bps === undefined) return "—";
  const n = Number(bps) / 100;
  return n.toFixed(fractionDigits) + "%";
}

/** Basis points -> fractional number (4000 -> 0.4). */
export function bpsToFraction(bps: number | bigint | undefined): number {
  if (bps === undefined) return 0;
  return Number(bps) / 10_000;
}

/** Truncate an address: 0x1234…abcd. */
export function shortAddress(addr?: string, lead = 6, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= lead + tail) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

/**
 * Share price = assets per 1 share, derived from convertToAssets(1 share).
 * Returns a float for display only (never use for on-chain math).
 */
export function sharePriceFromConvert(
  assetsForOneShare: bigint | undefined,
  assetDecimals: number,
): string {
  if (assetsForOneShare === undefined) return "—";
  const n = Number(formatUnits(assetsForOneShare, assetDecimals));
  return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/** Unix seconds (past) -> relative "3m ago" / "2h ago" / "5d ago" string. */
export function relativeAgo(unixSeconds: number | bigint | undefined): string {
  if (unixSeconds === undefined) return "—";
  const diffMs = Date.now() - Number(unixSeconds) * 1000;
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Unix seconds -> relative "in 3h 20m" / "expired" string. */
export function relativeFromNow(unixSeconds: bigint | number | undefined): string {
  if (unixSeconds === undefined) return "—";
  const target = Number(unixSeconds) * 1000;
  const diffMs = target - Date.now();
  if (diffMs <= 0) return "unlocked";
  const mins = Math.floor(diffMs / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
