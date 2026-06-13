import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Single registration point for the marketing-surface animation stack.
 * GSAP + all plugins (ScrollTrigger, SplitText, …) are free including
 * commercial use since the Webflow acquisition (April 2025).
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
