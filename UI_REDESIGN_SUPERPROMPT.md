# SUPERPROMPT — Vault Router UI Redesign

> Paste everything below this line into the agent.

---

You are a senior DeFi frontend engineer and brand designer. Your job is to **redesign the visual layer** of an existing, working Next.js app so it looks like a serious, institutional-grade DeFi product — with the punchy brand identity of **CoW Swap** and the cinematic scroll animation of **TradingView's Space Mission page**. You are restyling, not rebuilding: all wallet, contract, and data logic already works and must not change.

## 0. Read this first — what the previous build got wrong

The current UI was produced by an agent that misunderstood the brief in specific, identifiable ways. Every one of these is a hallucination or a default it fell back on. Do not repeat them. Each item is: **what it believed → what is actually true** (the "actually true" side is verified against the live reference sites and the CoW Swap open-source repo, not guessed).

1. **It hallucinated that "institutional finance" = light glassmorphism.** It shipped a pale-blue canvas, translucent frosted panels with `backdrop-blur`, and four animated "aurora" gradient blobs. → Real institutional DeFi surfaces (CoW Swap, trading terminals) are **dark, opaque, high-contrast, and typography-led**. Frosted glass + pastel glow is the universal signature of a vibe-coded template, the exact opposite of legitimacy. Verified: CoW Swap's surfaces are solid `#18193B` navy on darker canvas — zero translucency, zero blur.

2. **It mistook ambient decoration for "animation-heavy."** It added infinite loops that mean nothing: drifting blobs (20–26s), panning gradient text, shimmer sweeps on buttons, floating elements. → TradingView's Space Mission is animation-heavy in a completely different sense: **choreographed, scroll-driven scenes** — pinned sections, full-bleed pre-rendered video, reveals and counters that fire exactly once at the right scroll moment. Motion there always narrates content; nothing loops in the background for vibes. Delete every ambient loop; replace with choreography (§3, §4).

3. **It defaulted to Inter for everything.** Inter headings + Inter body is the most recognizable tell of a generated UI. → CoW Swap's "punch" is mostly typography: a distinctive display grotesk (**Studio Feixen Sans** — confirmed in their shipped woff2 files) for headings/buttons/tabs, a mono (**Studio Feixen Mono / JetBrains Mono**) for every number. Use **Space Grotesk** as the free stand-in for display; Inter is demoted to long body text only.

4. **It used stock Tailwind palette colors** (`blue-600` accent, emerald/rose semantics on a near-white canvas) — i.e., it had no brand opinion at all. → Adopt CoW Swap's actual verified palette from their `libs/ui/src/colors.ts`: navy `#18193B` paper, `#052B65`/`#012F7A` depth blues, electric `#00A1FF` primary, **yellow `#F2CD16` as a scarce punch accent**, success `#00D897`. A brand is a small number of opinionated colors used consistently — not a default scale.

5. **It gave every panel equal weight.** The dashboard is a flat grid of same-sized cards, so nothing is the product. → CoW Swap centers **one oversized focal widget** (the swap card) and arranges everything else around it. Here, `DepositCard` is that widget on `/app`. Hierarchy is the layout decision, not card styling.

6. **It rendered financial data as marketing cards instead of tables.** Activity, queues, and strategies live in rounded stat-cards. → Finance legitimacy comes from **dense data tables** (see CoW Swap's advanced orders table): mono tabular numerals, right-aligned numbers, row hover, status chips, visible column structure. Cards are for marketing; tables are for money.

7. **It applied one motion language everywhere.** The same reveals/float/shimmer run on marketing and inside the app. → These are two different products: **marketing = cinematic** (pinned GSAP scenes, scrubbed timelines, Lenis smooth scroll), **app = instant** (150–250ms micro-interactions only, no smooth-scroll hijack, a trader never waits for an animation).

8. **Do not hallucinate the references' tech stack either** — two facts agents reliably get wrong, both verified here so you don't have to guess:
   - TradingView's Space Mission uses **no animation framework at all**. Its page source and JS bundles contain no GSAP, no Lottie, no Rive, no three.js — it is pre-rendered `.webm`/`.mp4` video scenes in sticky sections, choreographed with plain `IntersectionObserver`. You will *recreate the effect* with the toolkit in §4; you are not copying their stack.
   - **GSAP and ALL its plugins (ScrollTrigger, SplitText, MorphSVG, …) are 100% free, including commercial use**, since Webflow acquired GreenSock (April 2025). Do not avoid SplitText/ScrollTrigger on the outdated belief that they're paid "Club" plugins.

Everything below is the full spec. Where the old build conflicts with it, the old build loses.

## 1. The project

- **Path:** `/mnt/adiii_dev/Ethereum-dev/vault-router-ui`
- **Stack:** Next.js 14 (App Router) + TypeScript, Tailwind CSS 3.4, framer-motion 11, wagmi 2 + viem 2 + RainbowKit 2, TanStack React Query 5.
- **What it is:** An institutional ERC-4626 USDC yield vault (EIP-2535 Diamond) on Arbitrum that routes deposits across Aave, Morpho, and Pendle.
- **Three surfaces:**
  1. **Marketing** — `src/app/(marketing)/` → `/`, `/docs`, `/security` (Hero, Pillars, StrategyShowcase, HowItWorks, Architecture, Integrations, SecurityTeaser)
  2. **User app** — `src/app/app/` → `/app`, `/app/strategies`, `/app/transparency` (VaultStats, DepositCard, PositionPanel, WithdrawQueuePanel, ActivityPanel, StrategyList, TransparencyView)
  3. **Role-gated consoles** — `/app/curator` (CuratorConsole) and `/app/admin` (AdminConsole), gated by `src/components/shell/RoleGate.tsx`

### Files you WILL touch (visual layer only)
- `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx` (fonts)
- Everything in `src/components/marketing/`, `src/components/app/`, `src/components/shell/`, `src/components/ui/`
- JSX structure and classNames inside components are fair game.

### Files you will NOT touch
- Any hook, wagmi config, contract ABI/address, viem call, React Query logic, or the role-gating logic itself. If a component mixes logic and markup, change only the markup/classes and keep every hook call and handler identical.

### What to kill (the current theme — delete it entirely)
The app currently has a light "liquid glass" theme: pale blue canvas, frosted translucent panels with `backdrop-blur`, animated "aurora" gradient blobs (`AuroraBackground.tsx`), panning gradient text, shimmer buttons. **All of it goes.** It reads as vibe-coded, not institutional. Replace wholesale with the system below. No glassmorphism, no aurora blobs, no gradient-pan text, no shimmer, no emoji anywhere.

## 2. Reference A — CoW Swap (clone this for the APP surfaces)

Reference: https://swap.cow.fi/#/1/advanced/WETH/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?tab=open&page=1

Clone CoW Swap's look as closely as possible, re-skinned for Vault Router. Its verified design DNA (taken from their live site and open-source repo `github.com/cowprotocol/cowswap`):

### Typography (the single biggest "punch" factor)
- CoW Swap uses **Studio Feixen Sans** (Regular/Medium/Semibold/Bold) + **Studio Feixen Mono**, with Inter as secondary. Studio Feixen is a paid commercial font — do not pirate it.
- **Use instead:** `Space Grotesk` (Google Fonts, via `next/font`) for all display/headings/buttons — it has the same quirky geometric-grotesk personality — and keep `JetBrains Mono` for every number, address, and table cell. Inter stays for long body text only.
- Headings are big, tight (`tracking-tight`), and Semibold/Bold. Buttons and tabs use the display font, never the body font.

### Color (CoW Swap's verified palette from `libs/ui/src/colors.ts` — adopt dark-first)
- Canvas / page background: very dark navy `#0B0C24`–`#18193B` (their `paperDark` is `#18193B`)
- Card/panel surfaces: `#18193B` on darker canvas, deep blue depth layers `#012F7A`, `#021E34`
- Primary brand blue: `#00A1FF` (electric, used for primary actions and highlights)
- Supporting blues: `#005EB7`, `#004293`, dark anchor `#052B65`
- Punch accent: yellow `#F2CD16` — use sparingly: key CTA, active tab underline, the one number that matters
- Semantic: success `#00D897`, alert/warning `#FFCA4A`, danger keep a rose/red
- Keep existing venue colors (Aave `#2dd4bf`, Morpho `#6366f1`, Pendle `#d946ef`, Idle `#94a3b8`) — they work on dark.
- Text: near-white `#F1F3FA` primary, desaturated blue-grey muted text.

### Layout & "cuts"
- **Chunky, confident cards:** solid (opaque) surfaces, 16–24px radius, visible 1px borders in a lighter navy — no blur, no translucency.
- **One focal widget:** CoW Swap centers an oversized swap card; mirror that — `DepositCard` becomes the centered, oversized focal widget on `/app`, with stats arranged around it.
- **Pill tabs** exactly like their `Open / Filled / Cancelled` order tabs: use for Deposit/Withdraw/Request-Exit and for activity filters. Active tab gets the yellow underline or filled pill.
- **Dense data tables** like their advanced orders table: mono tabular numerals, row hover states, right-aligned numbers, status chips. Use for ActivityPanel, WithdrawQueuePanel, StrategyList, TransparencyView, and both consoles.
- High-contrast section breaks: alternate `#0B0C24` and `#18193B` bands instead of floating cards on a glow.
- Their stack for feel reference: styled-components + framer-motion + react-spring + lottie-react. We keep Tailwind, but the rendered result should be indistinguishable in spirit.

## 3. Reference B — TradingView Space Mission (clone this for the MARKETING surface)

Reference: https://www.tradingview.com/space-mission/

Verified from the page source — its "heavy animation" is **not** a JS animation framework. It is:
- **Pre-rendered video scenes**: `<video muted autoplay loop playsinline preload>` served in `.webm` + h.264 + h.265 variants, full-bleed
- **Sticky/pinned scroll sections** (`scrollWrapper`) where scenes swap and progress as you scroll
- **IntersectionObserver-driven choreography** (confirmed in their `space_mission_landing` bundle) — elements reveal, counters fire, videos play exactly when their section enters the viewport
- Huge cinematic typography over the scenes, with stat callouts

Recreate that *experience* for the marketing pages using the toolkit in §4:
- **Hero:** full-viewport pinned dark scene. Headline animates in word-by-word (GSAP SplitText). Background = an abstract animated "liquidity routing" visual (Rive/Lottie vector animation, or a looping rendered `.webm` if available) — dark navy space with `#00A1FF` light streams routing into vault blocks.
- **Pillars / HowItWorks / Architecture:** each becomes a full-bleed pinned scene — ScrollTrigger pins the section while scroll progress scrubs a timeline (diagram draws itself, allocation flows animate, numbers count up).
- **Stats:** big counters (TVL, strategies, audits) that count up on first viewport entry.
- **StrategyShowcase:** horizontal scroll-scrub gallery of the three venue cards.

## 4. Mandated animation toolkit — install and use these explicitly

1. **`gsap` + `ScrollTrigger` + `SplitText`** — THE industry standard for this genre of scroll-cinematic page. Pinning, scrubbing, timelines, text reveals. GSAP and all its formerly-paid plugins are 100% free including commercial use since Webflow acquired it (April 2025) — use them freely. Use `useGSAP()` from `@gsap/react`.
2. **`lenis`** — smooth/inertial scrolling; pair it with ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`). Marketing surface only.
3. **`framer-motion`** (already installed, v11) — keep for component-level micro-interactions in the app surfaces: `AnimatePresence` page transitions, layout animations on tab switches, button taps, panel mounts. Don't use it for scroll-scrubbed scenes — that's GSAP's job.
4. **`@rive-app/react-canvas`** (preferred) or **`lottie-react`** — for the hero vector animation and any animated brand mark/loader. (CoW Swap itself ships `lottie-react`.)
5. **`@number-flow/react`** (or GSAP-tweened counters) — for animated stat numbers and live-updating vault figures.
6. **Scroll-scrubbed video technique** (the actual TradingView trick): if/when video assets exist, a `<video>` whose `currentTime` is driven by ScrollTrigger progress, sources in `.webm` + `.mp4`. Build the component; ship with the Rive/Lottie fallback until real footage exists.

**Motion rules (non-negotiable):**
- Respect `prefers-reduced-motion`: every scene must degrade to static layout with simple fades.
- Animate `transform` and `opacity` only; 60fps; no layout thrash.
- Lazy-load below-fold scenes and Rive/Lottie payloads (`next/dynamic`).
- App surfaces (anything under `/app`) get fast, subtle motion only (150–250ms) — the cinematic stuff lives on marketing pages. A trader checking a position should never wait for an animation.

## 5. Page-by-page spec

| Surface | Direction |
|---|---|
| `/` marketing | Full TradingView-style cinematic: pinned hero, SplitText headline, scroll-scrubbed scenes per section, count-up stats, dark navy throughout |
| `/docs`, `/security` | Same brand, calmer: typographic, generous spacing, simple reveals |
| `/app` dashboard | CoW Swap clone: centered oversized DepositCard widget, pill tabs, VaultStats as a top strip of mono-numeral stat blocks, ActivityPanel as dense table |
| `/app/strategies` | Orders-table aesthetic: venue rows with color chips, allocation bars, expandable detail |
| `/app/transparency` | Data-room feel: dense tables, on-chain proof links, mono everywhere |
| `/app/curator`, `/app/admin` | Same system, denser — "operator terminal": tighter spacing, more table, confirmation states with the yellow accent reserved for destructive/critical actions |

## 6. Hard rules

1. Dark-first. The light liquid-glass theme is deleted, not kept as an option.
2. No emoji, no decorative gradients, no blur/glassmorphism, no stock-photo feel.
3. Every numeral in the app is tabular mono (`font-variant-numeric: tabular-nums`). USDC amounts formatted `1,234,567.89 USDC`.
4. Contrast ≥ 4.5:1 for text; keyboard navigable; `prefers-reduced-motion` honored everywhere.
5. Zero changes to hooks, contract calls, wagmi/RainbowKit config, React Query keys, or RoleGate logic.
6. `npm run build` must pass clean at the end. Restyle RainbowKit via its theme API to match the navy/electric-blue system.

## 7. Acceptance checklist (verify before you finish)

- [ ] Space Grotesk renders on all headings/buttons; JetBrains Mono on all numbers/tables
- [ ] Palette is the CoW-derived navy/electric-blue/yellow system; no trace of the old pale-blue glass theme or AuroraBackground
- [ ] Marketing hero is a pinned GSAP scene with SplitText reveal and a Rive/Lottie (or video) background
- [ ] At least three marketing sections are scroll-scrubbed pinned scenes; stats count up on entry
- [ ] Lenis smooth scroll active on marketing, absent on `/app`
- [ ] `/app` is centered-widget + pill-tabs + dense tables, visually parallel to swap.cow.fi
- [ ] Reduced-motion mode verified (everything readable with animations off)
- [ ] All wallet flows (connect, deposit approve+deposit, withdraw, role-gated consoles) still work untouched
- [ ] `npm run build` passes
