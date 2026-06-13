"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cx } from "./primitives";

/** A point in a normalized series: x is index order, y is the raw value. */
export interface SeriesPoint {
  y: number;
}

function buildPath(values: number[], w: number, h: number, pad = 2) {
  if (values.length === 0) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + innerH - ((v - min) / span) * innerH;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(2)},${h - pad} L${pts[0][0].toFixed(2)},${h - pad} Z`;
  return { line, area };
}

/**
 * Area chart with an animated draw-in (pathLength). Self-contained SVG, no
 * dependency. When `data` is empty it renders the honest empty state — historical
 * series need an indexer/subgraph (ERC-4626 exposes no APY/history on-chain).
 */
export function AreaChart({
  data,
  color = "#5C8A2C",
  height = 160,
  className,
  emptyHint = "Historical data requires an indexer.",
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  emptyHint?: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const W = 600;

  if (!data || data.length < 2) {
    return (
      <div
        className={cx(
          "flex items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-1 text-2xs text-fg-faint",
          className,
        )}
        style={{ height }}
      >
        {emptyHint}
      </div>
    );
  }

  const { line, area } = buildPath(data, W, height);

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={cx("w-full", className)}
      style={{ height }}
      role="img"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#fill-${id})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: reduce ? 0 : 0.4 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0, 0, 0.25, 1] }}
      />
    </svg>
  );
}

/** Tiny inline sparkline (no axes), for stat cards. */
export function Sparkline({
  data,
  color = "#5C8A2C",
  width = 96,
  height = 28,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!data || data.length < 2) {
    return <span className={cx("inline-block rounded bg-surface-3/60", className)} style={{ width, height }} />;
  }
  const { line } = buildPath(data, width, height, 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} role="img">
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
