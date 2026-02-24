import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oven: "#232323",
        fiamma: "#ff7801",
        basilico: "#4eb971",
        crema: "#f5f0eb",
      },
      fontFamily: {
        headline: ["var(--font-oswald)", "Oswald", "sans-serif"],
        body: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "24px",
        "space-6": "32px",
        "space-7": "48px",
      },
      borderRadius: {
        base: "8px",
      },
      boxShadow: {
        "warm-sm": "0 1px 2px rgba(35, 35, 35, 0.08)",
        "warm-md": "0 2px 8px rgba(35, 35, 35, 0.12)",
        "warm-lg": "0 4px 16px rgba(35, 35, 35, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
