"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { cx } from "./primitives";

/** App-surface motion: instant micro-interactions only (150–250ms). */
const EASE_OUT = [0, 0, 0, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
};

/**
 * Scroll-reveal wrapper for app panels: a fast fade-rise, once. Respects
 * prefers-reduced-motion (renders static). `delay` staggers siblings.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.25, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}

/** Container that staggers Reveal-like children via variants. */
export function RevealGroup({
  children,
  className,
  stagger = 0.05,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/**
 * Number that counts up to `value` when scrolled into view, formatted via
 * `format`. Updates the DOM directly (no React re-renders). Static under
 * reduced-motion. Use for live TVL/APY headline figures.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.9,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const text = useTransform(spring, (n) => format(n));

  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    if (inView) mv.set(value);
  }, [inView, value, reduce, mv, format]);

  useEffect(() => {
    if (reduce) return;
    return text.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [text, reduce]);

  return (
    <span ref={ref} className={cx("num", className)}>
      {format(reduce ? value : 0)}
    </span>
  );
}

/** Subtle hover-lift for interactive cards. Static under reduced-motion. */
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
