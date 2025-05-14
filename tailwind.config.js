/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // Changed from blue to black
        secondary: "#FFD700", // Changed from teal to gold/yellow
        tertiary: "#222222", // Adjusted to a darker gray for contrast with black
        light: "#F5F5F5", // Kept light for contrast
        dark: "#777777", // Adjusted to gray for better compatibility
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}