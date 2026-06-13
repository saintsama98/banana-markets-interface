"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { cx } from "@/components/ui/primitives";

/**
 * GSAP-tweened counter: counts up to `value` the first time it enters the
 * viewport. Re-tweens if the live value arrives/changes later. Renders the
 * final value statically under prefers-reduced-motion.
 */
export function CountUp({
  value,
  format,
  className,
  duration = 1.4,
}: {
  value: number | undefined;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === undefined) {
      el.textContent = "—";
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = format(value);
      return;
    }
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: () => {
        el.textContent = format(obj.n);
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, format, duration]);

  return (
    <span ref={ref} className={cx("num", className)}>
      —
    </span>
  );
}
