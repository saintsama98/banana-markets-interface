import type { Address } from "viem";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { forkChain } from "./chains";

/** Chain the diamond is deployed on, from env (defaults to Arbitrum Sepolia). */
export const ACTIVE_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? arbitrumSepolia.id,
);

export const ACTIVE_CHAIN =
  ACTIVE_CHAIN_ID === forkChain.id
    ? forkChain
    : ACTIVE_CHAIN_ID === arbitrum.id
      ? arbitrum
      : arbitrumSepolia;

/**
 * Deployed Vault Router diamond address. Blank until deployment — the UI detects
 * this and renders a "not yet deployed" state instead of firing reads at 0x0.
 */
const rawVaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS?.trim();

export const VAULT_ADDRESS: Address | undefined =
  rawVaultAddress && /^0x[0-9a-fA-F]{40}$/.test(rawVaultAddress)
    ? (rawVaultAddress as Address)
    : undefined;

export const IS_VAULT_CONFIGURED = VAULT_ADDRESS !== undefined;

/** Block explorer base for the active chain (tx links in the activity feed). */
const explorerUrl = ACTIVE_CHAIN.blockExplorers?.default.url;

/**
 * Whether the active chain actually has a block explorer. False on the local
 * anvil fork — its tx/address hashes don't exist on any public explorer, so the
 * UI must render them as plain text rather than dead links.
 */
export const HAS_EXPLORER = Boolean(explorerUrl);

export const EXPLORER_URL = explorerUrl ?? "https://arbiscan.io";
