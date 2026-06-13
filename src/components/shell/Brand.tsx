import Link from "next/link";
import { cx } from "@/components/ui/primitives";

/**
 * Banana Markets wordmark — rendered as text (no raster, no white box) so it
 * sits cleanly on any surface: richer-yellow letters with a thin black ink
 * outline + hard offset shadow, matching the manga-ledger ink aesthetic.
 */
export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cx("group flex items-center gap-3", className)}>
      <span className="leading-none">
        <span
          className="block font-display text-2xl font-extrabold tracking-tight text-punch"
          style={{ WebkitTextStroke: "1.5px #141412", textShadow: "2px 2px 0 #141412" }}
        >
          Banana
        </span>
        <span className="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-[0.4em] text-ink/80">
          Markets
        </span>
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block font-display text-2xs font-medium text-ink">Meta-Aggregator For Retail</span>
      </span>
    </Link>
  );
}
