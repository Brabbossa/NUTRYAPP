/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#050505",
        card: "#111111",
        primary: "#00FF41",
        muted: "#2A2A2A",
      }
    },
  },
  plugins: [],
}
