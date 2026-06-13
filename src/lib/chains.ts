import { defineChain } from "viem";

/**
 * Local anvil mainnet-fork chain for the end-to-end demo. anvil runs with
 * `--chain-id 31337` (the canonical local id — wallets treat it cleanly, unlike
 * a localhost RPC claiming to be mainnet id 1). RPC overridable for non-default
 * ports.
 *
 * Kept in this dependency-light module (only `viem`) so that `contracts.ts` can
 * reference the chain WITHOUT importing the heavy wagmi/RainbowKit config in
 * `wagmi.ts` — that config calls `getDefaultConfig` (WalletConnect) at module
 * load and breaks Node prerender of the static marketing pages.
 */
export const forkRpc = process.env.NEXT_PUBLIC_FORK_RPC_URL ?? "http://127.0.0.1:8549";

export const forkChain = defineChain({
  id: 31337,
  name: "Anvil Fork",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [forkRpc] } },
});
