/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // AIDEN Design Tokens (CSS-variable backed)
        aiden: {
          primary: {
            DEFAULT: "var(--aiden-primary)",
            hover: "var(--aiden-primary-hover)",
            light: "var(--aiden-primary-light)",
            subtle: "var(--aiden-primary-subtle)",
          },
          accent: {
            DEFAULT: "var(--aiden-accent)",
            hover: "var(--aiden-accent-hover)",
            light: "var(--aiden-accent-light)",
            subtle: "var(--aiden-accent-subtle)",
          },
          bg: "var(--aiden-bg)",
          surface: {
            DEFAULT: "var(--aiden-surface)",
            secondary: "var(--aiden-surface-secondary)",
          },
          border: {
            DEFAULT: "var(--aiden-border)",
            subtle: "var(--aiden-border-subtle)",
          },
          text: {
            primary: "var(--aiden-text-primary)",
            secondary: "var(--aiden-text-secondary)",
            muted: "var(--aiden-text-muted)",
          },
          danger: {
            DEFAULT: "var(--aiden-danger)",
            hover: "var(--aiden-danger-hover)",
            light: "var(--aiden-danger-light)",
          },
          success: {
            DEFAULT: "var(--aiden-success)",
            light: "var(--aiden-success-light)",
          },
          warning: {
            DEFAULT: "var(--aiden-warning)",
            light: "var(--aiden-warning-light)",
          },
          info: {
            DEFAULT: "var(--aiden-info)",
            light: "var(--aiden-info-light)",
          },
        },
        // Backward-compatible color aliases mapping directly to AIDEN design tokens
        paper: "var(--aiden-bg)",
        ink: "var(--aiden-text-primary)",
        teal: {
          DEFAULT: "var(--aiden-primary)",
          dark: "var(--aiden-primary-hover)",
          light: "var(--aiden-primary-light)",
          subtle: "var(--aiden-primary-subtle)",
        },
        marigold: {
          DEFAULT: "var(--aiden-accent)",
          dark: "var(--aiden-accent-hover)",
          light: "var(--aiden-accent-light)",
          subtle: "var(--aiden-accent-subtle)",
        },
        rani: {
          DEFAULT: "var(--aiden-danger)",
          dark: "var(--aiden-danger-hover)",
          light: "var(--aiden-danger-light)",
        },
      },
      fontFamily: {
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      borderRadius: {
        card: "14px",
        "aiden-sm": "8px",
        "aiden-md": "12px",
        "aiden-lg": "16px",
        "aiden-xl": "24px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(23, 34, 30, 0.04)",
        card: "0 3px 12px -2px rgba(23, 34, 30, 0.06), 0 1px 4px -1px rgba(23, 34, 30, 0.03)",
        "card-hover": "0 12px 28px -4px rgba(23, 34, 30, 0.1), 0 4px 10px -2px rgba(23, 34, 30, 0.05)",
        modal: "0 20px 40px -6px rgba(23, 34, 30, 0.18), 0 8px 18px -4px rgba(23, 34, 30, 0.08)",
        "glow-teal": "0 0 20px -2px rgba(47, 111, 94, 0.28)",
        "glow-gold": "0 0 20px -2px rgba(232, 180, 79, 0.32)",
      },
    },
  },
  plugins: [],
};
