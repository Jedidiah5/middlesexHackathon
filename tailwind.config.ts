import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: "#171717",
        perplexity: "#404040",
        surface: "#ffffff",
        "surface-elevated": "#ffffff",
        /** Accent green for selective emphasis on B&W UI */
        accent: "#15803d",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "marker-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.12)", opacity: "0.92" },
        },
      },
      animation: {
        "marker-pulse": "marker-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
