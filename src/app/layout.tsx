import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { LiquidGlassLayer } from "@/components/ui/LiquidGlassLayer";
import { CrystalField } from "@/components/ui/CrystalField";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Banana Markets — institutional USDC yield on Arbitrum",
  description:
    "An ERC-4626 router vault on an EIP-2535 Diamond. Deposit USDC; earn risk-gated yield routed across Aave, Morpho and Pendle, with on-chain transparency and a curator-operated risk model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <LiquidGlassLayer />
        <CrystalField />
        <TopProgressBar />
        <SmoothScroll>
          <Providers>{children}</Providers>
        </SmoothScroll>
      </body>
    </html>
  );
}
