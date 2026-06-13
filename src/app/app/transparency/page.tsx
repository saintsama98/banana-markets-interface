import type { Metadata } from "next";
import { TransparencyView } from "@/components/app/TransparencyView";

export const metadata: Metadata = {
  title: "Transparency — Banana Markets",
  description: "Real-time backing and allocation, read directly from the vault contract.",
};

export default function TransparencyPage() {
  return <TransparencyView />;
}
