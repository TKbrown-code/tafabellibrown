import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const c = (v: string) => `hsl(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        bg: c("bg"),
        surface: c("surface"),
        "surface-2": c("surface-2"),
        border: c("border"),
        ink: c("ink"),
        muted: c("muted"),
        faint: c("faint"),
        accent: c("accent"),
        "accent-hover": c("accent-hover"),
        "accent-soft": c("accent-soft"),
        "accent-ink": c("accent-ink"),
        success: c("success"),
        danger: c("danger"),
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "'Noto Sans SC'", "system-ui", "sans-serif"],
        sans: ["'Satoshi'", "'Noto Sans SC'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: {
        soft: "0 1px 2px hsl(var(--shadow) / 0.06), 0 8px 24px -12px hsl(var(--shadow) / 0.14)",
        lift: "0 2px 4px hsl(var(--shadow) / 0.06), 0 20px 40px -16px hsl(var(--shadow) / 0.22)",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
