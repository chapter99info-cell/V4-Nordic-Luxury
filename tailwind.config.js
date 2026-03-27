module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Prompt", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        primary: "#D4AF37",
        secondary: "#1A1A1B",
        accent: "#D4AF37",
        background: "#FFFFFF",
        section: "#FAFAF5",
        earth: "#1A1A1B",
        sage: "#D4AF37",
        beige: "#F5F5F0",
        gold: "#D4AF37",
      },
    },
  },
  plugins: [],
}
