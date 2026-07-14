/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070d1a", // Deep dark blue background
        card: "#0f1929",       // Slightly lighter dark blue for cards
        border: "rgba(255, 255, 255, 0.12)",
        foreground: "#ffffff",
        muted: "rgba(255, 255, 255, 0.05)",
        "muted-foreground": "#94a3b8",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
