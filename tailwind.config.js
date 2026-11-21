/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // Changed from blue to black
        secondary: "rgb(var(--accent) / <alpha-value>)", // theme accent, default #FFD700 (see src/theme)
        "on-accent": "rgb(var(--on-accent) / <alpha-value>)", // black or white text on the accent
        tertiary: "#222222", // Adjusted to a darker gray for contrast with black
        light: "#F5F5F5", // Kept light for contrast
        dark: "#777777", // Adjusted to gray for better compatibility
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
      },
    },
  },
  plugins: [],
}