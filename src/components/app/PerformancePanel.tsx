"use client";

import { useState } from "react";
import { useVaultHistory } from "@/hooks/useVaultHistory";
import { Panel, PanelHeader, cx } from "@/components/ui/primitives";
import { AreaChart } from "@/components/ui/charts";

type Metric = "tvl" | "price" | "apy";

const METRICS: { key: Metric; label: string }[] = [
  { key: "tvl", label: "TVL" },
  { key: "price", label: "Share price" },
  { key: "apy", label: "APY" },
];

function fmt(metric: Metric, v: number | undefined): string {
  if (v === undefined) return "—";
  if (metric === "tvl") return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (metric === "price") return v.toFixed(4);
  return `${v >= 0 ? "" : ""}${v.toFixed(2)}%`;
}

/**
 * Vault performance over time — TVL, share price and APY, all reconstructed from
 * on-chain events (see useVaultHistory). Vault-level (not per-venue): the chain
 * only emits vault-wide TVL snapshots, so a venue page shows the whole vault's
 * trajectory, which is what a depositor's shares actually track.
 */
export function PerformancePanel({ color = "#5C8A2C" }: { color?: string }) {
  const { points, isLoading, isError } = useVaultHistory();
  const [metric, setMetric] = useState<Metric>("tvl");

  const series = points.map((p) => (metric === "tvl" ? p.tvl : metric === "price" ? p.sharePrice : p.apy));
  const latestVal = series.length ? series[series.length - 1] : undefined;
  const firstVal = series.length ? series[0] : undefined;
  const delta = latestVal !== undefined && firstVal !== undefined ? latestVal - firstVal : undefined;
  const deltaPct =
    metric !== "apy" && delta !== undefined && firstVal ? (delta / Math.abs(firstVal)) * 100 : undefined;

  const emptyHint = isError
    ? "Couldn’t read events from the RPC."
    : isLoading
      ? "Indexing events…"
      : "No history yet — deposit to start the series.";

  return (
    <Panel>
      <PanelHeader title="Performance" hint="Vault TVL · share price · APY — indexed from on-chain events" />

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="num text-2xl text-fg">{fmt(metric, latestVal)}</div>
            {deltaPct !== undefined && Number.isFinite(deltaPct) && (
              <div className={cx("num text-2xs", deltaPct >= 0 ? "text-up" : "text-down")}>
                {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(2)}% over window
              </div>
            )}
          </div>

          <div className="pill-tabs" role="tablist">
            {METRICS.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={metric === m.key}
                data-active={metric === m.key}
                onClick={() => setMetric(m.key)}
                className="pill-tab"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <AreaChart data={series} color={color} emptyHint={emptyHint} />

        <p className="text-2xs leading-relaxed text-fg-faint">
          Reconstructed from <span className="text-fg-muted">Rebalanced / Deposit / Withdraw</span> events — no
          subgraph. On a frozen fork, share price &amp; APY stay near flat (no real time elapses); TVL tracks your
          deposits and withdrawals.
        </p>
      </div>
    </Panel>
  );
}
