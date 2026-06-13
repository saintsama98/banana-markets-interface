import type { ReactNode } from "react";

/** className concatenation helper. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Surfaces */

/** Solid opaque panel — the default surface for all data. */
export function Panel({
  children,
  className,
  raised,
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
}) {
  return <div className={cx(raised ? "panel-2" : "panel", className)}>{children}</div>;
}

/** Focal panel — the one oversized widget per page (deposit card). Solid, never translucent. */
export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("glass", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
      <div>
        <h2 className="font-display text-sm font-semibold text-fg">{title}</h2>
        {hint && <p className="mt-0.5 text-2xs text-fg-faint">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ Pill tabs */

/** CoW-style pill tab strip (Open / Filled / Cancelled). */
export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("pill-tabs", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          data-active={active === t.key}
          onClick={() => onChange(t.key)}
          className="pill-tab"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- Accents */

type Accent = "matcha" | "teal" | "lime" | "up" | "positive" | "down" | "negative" | "warning" | "punch";

function accentClass(accent?: Accent): string {
  switch (accent) {
    case "matcha":
    case "teal": // legacy alias
    case "lime": // legacy alias
      return "text-accent";
    case "punch":
      return "text-warning";
    case "up":
    case "positive":
      return "text-up";
    case "down":
    case "negative":
      return "text-down";
    case "warning":
      return "text-warning";
    default:
      return "text-fg";
  }
}

/** Headline metric with overline label and optional sub + delta. */
export function Stat({
  label,
  value,
  sub,
  accent,
  delta,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
  delta?: { value: string; dir: "up" | "down" };
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="overline">{label}</div>
      <div
        className={cx(
          "mt-1 truncate text-2xl font-semibold leading-tight",
          mono ? "num" : "font-display",
          accentClass(accent),
        )}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {delta && <Delta value={delta.value} dir={delta.dir} />}
        {sub && <div className="text-xs text-fg-muted">{sub}</div>}
      </div>
    </div>
  );
}

/** Up/down delta chip — color is ALWAYS paired with a ▲/▼ glyph (CVD-safe). */
export function Delta({ value, dir }: { value: string; dir: "up" | "down" }) {
  return (
    <span
      className={cx(
        "num inline-flex items-center gap-0.5 text-xs font-medium",
        dir === "up" ? "text-up" : "text-down",
      )}
    >
      <span aria-hidden>{dir === "up" ? "▲" : "▼"}</span>
      {value}
    </span>
  );
}

/* --------------------------------------------------------------------- States */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-surface-3/70", className)} />;
}

export function StatusDot({
  tone,
  label,
}: {
  tone: "positive" | "negative" | "warning" | "neutral";
  label: string;
}) {
  const color =
    tone === "positive"
      ? "bg-up"
      : tone === "negative"
        ? "bg-down"
        : tone === "warning"
          ? "bg-warning"
          : "bg-fg-faint";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <span className={cx("h-1.5 w-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "matcha" | "teal" | "warning" | "negative" | "punch" | "neutral";
}) {
  const cls =
    tone === "matcha" || tone === "teal"
      ? "bg-accent/25 text-fg"
      : tone === "punch"
        ? "bg-punch/40 text-fg"
        : tone === "warning"
          ? "bg-warning/25 text-fg"
          : tone === "negative"
            ? "bg-down/20 text-fg"
            : "bg-surface-2 text-fg-muted";
  return <span className={cx("tag", cls)}>{children}</span>;
}

/** Lock glyph for role-gated affordances (no emoji on this product). */
export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cx("h-3 w-3", className)} aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Empty/placeholder state. */
export function Placeholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-1 px-6 py-16 text-center">
      <div className="mb-2 font-display text-sm font-medium text-fg-muted">{title}</div>
      {children && <div className="max-w-md text-xs text-fg-faint">{children}</div>}
    </div>
  );
}
