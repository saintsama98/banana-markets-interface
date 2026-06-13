"use client";

import { useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";

// RainbowKit re-skinned to the cream / matcha / ink system.
const baseTheme = lightTheme({
  accentColor: "#7CA83C",
  accentColorForeground: "#141412",
  borderRadius: "medium",
  overlayBlur: "none",
});

const vaultRouterTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    modalBackground: "#FFF7E0",
    modalBorder: "#141412",
    profileForeground: "#FFF7E0",
    connectButtonBackground: "#FFF7E0",
    connectButtonInnerBackground: "#FFEEBC",
    modalText: "#141412",
    modalTextSecondary: "#4A4632",
  },
  fonts: { ...baseTheme.fonts, body: "var(--font-display)" },
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={vaultRouterTheme} modalSize="compact">
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
