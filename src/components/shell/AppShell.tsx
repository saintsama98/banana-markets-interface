"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRole } from "@/hooks/useRole";
import { useVault } from "@/hooks/useVault";
import { ACTIVE_CHAIN } from "@/lib/contracts";
import { cx, Tag, LockIcon } from "@/components/ui/primitives";
import { PageTransition } from "@/components/ui/PageTransition";
import { Brand } from "./Brand";
import { NotDeployedBanner } from "./NotDeployedBanner";
import { TrustStrip } from "./TrustStrip";

interface NavItem {
  href: string;
  label: string;
  requires: "user" | "curator" | "owner";
}

const NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", requires: "user" },
  { href: "/app/strategies", label: "Strategies", requires: "user" },
  { href: "/app/transparency", label: "Transparency", requires: "user" },
  { href: "/app/curator", label: "Curator", requires: "curator" },
  { href: "/app/admin", label: "Admin", requires: "owner" },
];

const RANK = { disconnected: 0, user: 1, curator: 2, owner: 3 } as const;

const ROLE_TONE = { owner: "punch", curator: "matcha", user: "neutral", disconnected: "neutral" } as const;
const ROLE_LABEL = { owner: "Owner", curator: "Curator", user: "Depositor", disconnected: "Guest" } as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role } = useRole();
  const { isConfigured, data } = useVault();
  const myRank = RANK[role];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center gap-6 px-6 sm:px-10">
          <Brand href="/app" />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
              const allowed = myRank >= RANK[item.requires];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-2 font-display text-sm font-medium transition-colors duration-150",
                    active ? "text-fg" : "text-fg-muted hover:bg-surface-3 hover:text-fg",
                  )}
                >
                  {item.label}
                  {!allowed && <LockIcon className="text-fg-faint" />}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-ink" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {!isConfigured && <Tag tone="warning">testnet · not deployed</Tag>}
            {data.paused && <Tag tone="negative">paused</Tag>}
            <span className="hidden items-center gap-1.5 text-2xs text-fg-muted sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-up" />
              {ACTIVE_CHAIN.name}
            </span>
            {role !== "disconnected" && <Tag tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Tag>}
            <ConnectButton
              showBalance={false}
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              chainStatus="none"
            />
          </div>
        </div>

        {/* mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t-2 border-ink px-4 py-2 lg:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "whitespace-nowrap rounded-md px-2.5 py-1 font-display text-xs",
                  active ? "border-2 border-ink bg-surface-1/70 text-fg backdrop-blur-sm" : "text-fg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1680px] flex-1 px-6 py-8 sm:px-10">
        <NotDeployedBanner />
        <PageTransition>{children}</PageTransition>
      </main>

      <TrustStrip />
    </div>
  );
}
