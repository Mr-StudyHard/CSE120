/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "button-outline": "#D7827E",
        background: "#2A2E3E",
        "card-bg": "#3A3F52",
      },
    },
  },
  plugins: [],
};
