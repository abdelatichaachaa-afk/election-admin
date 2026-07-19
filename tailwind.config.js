/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
