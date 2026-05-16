import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        title: ["Playfair Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        base: "#FAFAF9",
        ink: "#0A0A0A",
        "ink-muted": "#6B6B6B",
        "ink-faint": "#A8A8A8",
        accent: "#F0A500",
        "accent-light": "#FEF3C7",
        "accent-dim": "#FDE68A",
        border: "rgba(0,0,0,0.08)",
        "border-strong": "rgba(0,0,0,0.14)",
        surface: "#FFFFFF",
        "surface-raised": "#F5F5F3",
        danger: "#EF4444",
        "danger-light": "#FEF2F2",
        success: "#10B981",
        "success-light": "#ECFDF5",
        warning: "#F59E0B",
        "warning-light": "#FFFBEB",
      },
      boxShadow: {
        card: "0 1px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        float: "0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
        modal: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
