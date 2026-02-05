/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F1A",
        surface: "#10192D",
        card: "#131F3A",
        text: "#EAF0FF",
        muted: "#9DB0D0",
        border: "#233254",
        primary: "#7C5CFF",
        secondary: "#22D3EE",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.35)"
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
