/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        schoolpay: {
          navy: "#14213D",
          blue: "#2563EB",
          lightBlue: "#3B82F6",
          dark: "#0F172A",
          green: "#16A34A",
          amber: "#F59E0B",
          red: "#DC2626",
          grayLight: "#F8FAFC",
          grayBorder: "#E2E8F0"
        }
      }
    },
  },
  plugins: [],
};
