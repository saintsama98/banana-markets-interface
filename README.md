# Vault Router UI

Frontend for the **Vault Router** — an ERC-4626 yield vault built on an EIP-2535
Diamond (USDC on Arbitrum). One role-aware app serves three surfaces:

| Surface | Route | Who | What |
| --- | --- | --- | --- |
| **Overview** | `/` | Anyone / depositors | TVL, share price, live allocation, deposit / withdraw / request-exit, your position, withdrawal queue |
| **Curator** | `/curator` | Curator (or owner) | Rebalance, harvest, per-strategy allocation table, fulfill withdrawals |
| **Admin** | `/admin` | Owner | Circuit breaker, fees, risk bounds, two-step ownership |

The connected wallet's on-chain role (`owner()` / `isCurator()`) decides which
surfaces unlock; locked ones show a gate instead of the content.

> **Design:** institutional dark terminal — deep-navy canvas, teal/lime data
> accents, monospace tabular numerics.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **wagmi v2** + **viem** + **RainbowKit v2** (wallet + reads/writes)
- **TanStack Query** (caching/refetch) · **Tailwind CSS 3** (theme)

## Getting started

```bash
cd /mnt/adiii_dev/Ethereum-dev/vault-router-ui
cp .env.example .env.local      # then fill in values (see below)
npm install                     # already run once during scaffolding
npm run dev                     # http://localhost:3000
```

### Environment (`.env.local`)

| Var | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_VAULT_ADDRESS` | when deployed | Address of the deployed Vault Router diamond. **Leave blank while the contract is still in development** — the UI detects this and runs in skeleton mode (layout + theme render, on-chain reads disabled, banner shown). |
| `NEXT_PUBLIC_CHAIN_ID` | yes | `42161` = Arbitrum One, `421614` = Arbitrum Sepolia (default). |
| `NEXT_PUBLIC_WC_PROJECT_ID` | recommended | WalletConnect Cloud id (free at https://cloud.walletconnect.com). Injected wallets (MetaMask/Rabby) work without it; WalletConnect/mobile QR needs it. |
| `NEXT_PUBLIC_ARBITRUM_RPC_URL` | optional | Override the public RPC. |
| `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL` | optional | Override the public testnet RPC. |

Once the diamond is deployed, set `NEXT_PUBLIC_VAULT_ADDRESS` + `NEXT_PUBLIC_CHAIN_ID`
and the whole app comes alive against live state — no code change needed.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## How it maps to the contracts

- **ABI:** `src/abi/vault.ts` — the diamond's facets flattened into one ABI
  (every selector the UI touches). Hand-authored from the verified surface of
  `vault-router-diamond`. **Regenerate from Foundry artifacts after deploy** for
  full fidelity (`forge inspect Vault abi` + each `*Facet`, merged).
- **Reads:** `src/hooks/*` batch view calls via `useReadContracts` (multicall),
  refetching every 15–30s — vault stats, allocations, your position, role,
  withdrawal queue.
- **Writes:** components use `useWriteContract` + `useWaitForTransactionReceipt`
  (deposit/approve, withdraw, request/cancel/fulfill, rebalance, harvest, fees,
  pause, ownership).
- **Strategy ids:** `src/lib/strategies.ts` decodes each `bytes32` strategy id to
  a label + color (Aave / Morpho / Pendle / Idle), with a hex fallback for any
  strategy added later.

### The keeper is intentionally not wired in

The off-chain `vault-router-keeper` has **no external API** (verified): it reads
the same chain state this UI reads and writes curator transactions on-chain. So
everything it does already surfaces here via on-chain reads + events — no keeper
integration needed. The Curator console mirrors the keeper's actions as a manual
operator override.

*Future hook:* the keeper computes rich decision intelligence (per-strategy risk,
expected-loss, rebalance rationale) but only logs it to stdout. A "why did the
agent rebalance?" panel would require adding an API/log-shipper to the keeper
first — out of scope today, easy to slot in later.

## Notes

- The `indexedDB is not defined` lines during `npm run build` are **benign** —
  wagmi/WalletConnect probe browser storage during static prerender and fall back
  gracefully on the client. The build still completes (exit 0).
- All pages are client-interactive; the layout/shell prerenders statically.
