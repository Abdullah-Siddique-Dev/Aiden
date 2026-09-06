/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF8F1",
        ink: "#16241F",
        teal: { DEFAULT: "#1F6F5C", dark: "#164F42", light: "#DCEEE8" },
        marigold: { DEFAULT: "#E1A73E", dark: "#B9822A" },
        rani: { DEFAULT: "#C23B6B" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
