"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";
import { Brand } from "@/components/shell/Brand";

const LINKS = [
  { href: "/#strategies", label: "Strategies" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/security", label: "Security" },
  { href: "/docs", label: "Docs" },
];

export function MarketingNav() {
  const pathname = usePathname();
  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-6 px-6 sm:px-10">
        <Brand href="/" />
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href.startsWith("/") && !l.href.includes("#") && pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-lg px-3 py-2 font-display text-sm font-medium transition-colors duration-150",
                  active ? "text-fg shadow-[inset_0_-2px_0_0_#141412]" : "text-fg-muted hover:bg-surface-3 hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/app" className="btn-primary md:ml-2">
          Launch App
          <span aria-hidden>→</span>
        </Link>
      </div>
    </header>
  );
}
