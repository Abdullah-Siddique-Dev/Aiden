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
        display: ["Fraunces", "serif"],
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
        subtle: "0 1px 3px rgba(23, 34, 30, 0.05)",
        card: "0 2px 8px -2px rgba(23, 34, 30, 0.06), 0 1px 4px -1px rgba(23, 34, 30, 0.04)",
        "card-hover": "0 8px 20px -3px rgba(23, 34, 30, 0.09), 0 3px 8px -2px rgba(23, 34, 30, 0.05)",
        modal: "0 16px 36px -4px rgba(23, 34, 30, 0.16), 0 6px 16px -3px rgba(23, 34, 30, 0.08)",
      },
    },
  },
  plugins: [],
};
