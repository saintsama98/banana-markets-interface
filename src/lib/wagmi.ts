import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { http } from "wagmi";
import { forkChain, forkRpc } from "./chains";

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

const arbitrumRpc = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL;
const arbitrumSepoliaRpc = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL;

/**
 * wagmi + RainbowKit config. Both Arbitrum One and Arbitrum Sepolia are enabled
 * so the same build serves testnet and mainnet; `NEXT_PUBLIC_CHAIN_ID` picks the
 * one the vault lives on. A WalletConnect projectId is required for the WC/mobile
 * connectors but injected wallets (MetaMask/Rabby) work without one.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Banana Markets",
  projectId: wcProjectId || "00000000000000000000000000000000",
  chains: [forkChain, arbitrum, arbitrumSepolia],
  transports: {
    [forkChain.id]: http(forkRpc),
    [arbitrum.id]: http(arbitrumRpc),
    [arbitrumSepolia.id]: http(arbitrumSepoliaRpc),
  },
  ssr: true,
});
