import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/** A marketing section wrapper with consistent max-width + vertical rhythm. */
export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx("relative scroll-mt-20 py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-10">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cx(
        "legible max-w-3xl",
        align === "center" ? "mx-auto text-center" : "-ml-[1.1rem] -mt-[0.5rem]",
      )}
    >
      {eyebrow && <div className="overline text-accent">{eyebrow}</div>}
      <h2 className="display mt-3 text-3xl text-fg sm:text-5xl">{title}</h2>
      {blurb && <p className="mt-4 text-pretty text-sm leading-relaxed text-fg-muted sm:text-base">{blurb}</p>}
    </div>
  );
}
