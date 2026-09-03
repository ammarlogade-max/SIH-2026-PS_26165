import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e9ff",
          200: "#bcd8ff",
          300: "#90bfff",
          400: "#5f9bf9",
          500: "#3478e5",
          600: "#2563c7",
          700: "#2050a1",
          800: "#214584",
          900: "#213b6c",
          950: "#17294a",
        },
        surface: {
          DEFAULT: token("--surface"),
          card: token("--surface-card"),
          border: token("--surface-border"),
          hover: token("--surface-hover"),
          raised: token("--surface-raised"),
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 2px 5px rgb(0 0 0 / 0.03)",
        "card-dark": "0 1px 2px rgb(0 0 0 / 0.24), 0 4px 12px rgb(0 0 0 / 0.16)",
        panel: "0 0 0 1px rgb(var(--surface-border)), 0 1px 3px rgb(0 0 0 / 0.12)",
      },
      backgroundImage: {
        "dashboard-grid":
          "linear-gradient(rgb(var(--grid-line) / 0.45) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--grid-line) / 0.45) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "fade-in": "fadeIn 220ms ease-out both",
        "slide-up": "slideUp 260ms ease-out both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
