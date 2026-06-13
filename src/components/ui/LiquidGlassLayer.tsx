"use client";

import { useEffect } from "react";

/**
 * The Liquid Glass functional layer, mounted once in the root layout.
 * Apple-strict: content stays solid; glass behaviors apply to the floating
 * controls/navigation layer only.
 *
 * 1. Ambient backdrop — soft drifting color fields under the page, so the
 *    glass nav/controls have real color to refract.
 * 2. A hidden SVG `feDisplacementMap` lens — Chromium applies it via
 *    `backdrop-filter: url(#liquid-lens)` on the scrolled nav for true
 *    refraction; Safari/Firefox fall back to frosted blur.
 * 3. Scroll-edge effect — sets `data-scrolled` on <html> so the nav glass
 *    intensifies once content is moving beneath it (Apple's scroll edge).
 * 4. A delegated pointer tracker feeding `--mx`/`--my` to glass CONTROLS so
 *    a specular highlight follows the cursor (the "liquid" hover).
 */

const SHEEN_TARGETS = ".btn,.pill-tabs";

export function LiquidGlassLayer() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(SHEEN_TARGETS) as HTMLElement | null;
      if (!t || raf) return;
      const { clientX, clientY } = e;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = t.getBoundingClientRect();
        t.style.setProperty("--mx", `${((clientX - r.left) / r.width) * 100}%`);
        t.style.setProperty("--my", `${((clientY - r.top) / r.height) * 100}%`);
      });
    };

    const onScroll = () => {
      document.documentElement.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };
    onScroll();

    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Ambient field the glass refracts — fixed, behind everything. */}
      <div className="liquid-bg" aria-hidden>
        <span className="liquid-blob liquid-blob-1" />
        <span className="liquid-blob liquid-blob-2" />
        <span className="liquid-blob liquid-blob-3" />
        <span className="liquid-blob liquid-blob-4" />
      </div>

      {/* Displacement lens for Chromium's backdrop-filter: url(). */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
        <filter id="liquid-lens" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  );
}
