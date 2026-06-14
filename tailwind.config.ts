import type { Config } from "tailwindcss";

/**
 * Vault Router design system — "manga ledger": rich yellow canvas, cream
 * panels, matcha buttons, and bold black ink borders with hard offset shadows
 * on every surface. Color count is deliberately small so nothing floods:
 * yellow (canvas) + cream (paper) + matcha (action) + ink (structure), with
 * gold reserved for the one CTA that matters.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
        },
        ink: "#141412",
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          faint: "rgb(var(--fg-faint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "#5C8A2C",
          strong: "#46701F",
          on: "#141412",
        },
        punch: {
          DEFAULT: "#FFB000",
          on: "#141412",
        },
        up: "#1E7A3C",
        down: "#C6303E",
        positive: "#1E7A3C",
        negative: "#C6303E",
        warning: "#B45309",
        venue: {
          aave: "#0F766E",
          morpho: "#4338CA",
          pendle: "#A21CAF",
          compound: "#00D395",
          idle: "#57534E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        panel: "20px",
        card: "14px",
      },
      boxShadow: {
        // Hard manga offsets — no blur, pure ink.
        "ink-sm": "3px 3px 0 0 #141412",
        ink: "5px 5px 0 0 #141412",
        "ink-lg": "8px 8px 0 0 #141412",
        // Legacy names map onto the ink system so stragglers stay on-style.
        panel: "5px 5px 0 0 #141412",
        focal: "8px 8px 0 0 #141412",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin360: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0,0,0,1) both",
        // Perpetual background machinery — slow, linear, never-ending.
        "gear-cw": "spin360 90s linear infinite",
        "gear-ccw": "spin360 120s linear infinite reverse",
        "gear-cw-fast": "spin360 60s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
