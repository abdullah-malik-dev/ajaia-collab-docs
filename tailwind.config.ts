import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#EDEFF2",
        paper: "#FFFFFF",
        ink: { DEFAULT: "#1C2127", muted: "#5F6B78", faint: "#8B95A1" },
        line: { DEFAULT: "#D8DDE3", strong: "#B9C1CA" },
        accent: { DEFAULT: "#2E5C8A", hover: "#254B71", soft: "#E4ECF5" },
        danger: { DEFAULT: "#A33A2F", soft: "#F7E6E3" },
        ok: { DEFAULT: "#2F6B46", soft: "#E3F0E7" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { page: "52rem" },
    },
  },
  plugins: [],
};
export default config;
