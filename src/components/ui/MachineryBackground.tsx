import type { CSSProperties } from "react";

/**
 * Faceted-crystal backdrop — large, low-poly gold crystals (à la a16z's angular
 * hero shapes) rotating + drifting slowly behind all content, on the yellow
 * canvas. Each crystal is a handful of shaded SVG facets with ink edges, so it
 * reads as a turning 3D mass in the brand palette rather than flat clip-art.
 *
 * Mounted once in the root layout, so it's identical on every page. Inline
 * styles + globals keyframes (spin360 / bg-float) → renders and animates
 * regardless of Tailwind regeneration; body's `isolation: isolate` lets these
 * negative-z layers paint above the canvas, behind content. The global
 * prefers-reduced-motion guard stops the motion for users who opt out.
 */

/** One faceted crystal "point" — 5 shaded facets with thin ink edges. */
function Crystal({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 80 140" style={{ position: "absolute", overflow: "visible", ...style }} aria-hidden focusable="false">
      <g stroke="#141412" strokeWidth={1.1} strokeLinejoin="round">
        {/* point — left + right top facets */}
        <polygon points="40,6 12,48 40,42" fill="#FFE69A" />
        <polygon points="40,6 40,42 68,48" fill="#E8A800" />
        {/* body — left + right prism faces */}
        <polygon points="12,48 40,42 40,130 12,122" fill="#CF9213" />
        <polygon points="40,42 68,48 68,122 40,130" fill="#A6720A" />
        {/* base */}
        <polygon points="12,122 40,130 68,122" fill="#7A5406" />
      </g>
    </svg>
  );
}

export function MachineryBackground() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -5, overflow: "hidden", pointerEvents: "none" }}>
      {/* primary crystal — bottom-right, large, slow clockwise tumble */}
      <Crystal
        style={{
          bottom: "-10rem",
          right: "-8rem",
          width: "40rem",
          height: "54rem",
          opacity: 0.6,
          animation: "spin360 140s linear infinite, bg-float 18s ease-in-out infinite",
        }}
      />
      {/* counter crystal — top-left, anticlockwise */}
      <Crystal
        style={{
          top: "-12rem",
          left: "-9rem",
          width: "28rem",
          height: "38rem",
          opacity: 0.5,
          animation: "spin360 180s linear infinite reverse, bg-float 22s ease-in-out infinite",
        }}
      />
      {/* idler crystal — mid-right edge, smaller */}
      <Crystal
        style={{
          top: "26%",
          right: "-6rem",
          width: "18rem",
          height: "24rem",
          opacity: 0.42,
          animation: "spin360 110s linear infinite, bg-float 15s ease-in-out infinite",
        }}
      />
    </div>
  );
}
