/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef5ff",
          100: "#dfeaff",
          200: "#bfd4ff",
          300: "#9ebcff",
          400: "#6c96ff",
          500: "#416dff",   // สีหลัก (มินิมอล โทนเย็น)
          600: "#2f54db",
          700: "#2542ad",
          800: "#1d3385",
          900: "#182a6a",
        },
        ink: {
          50:  "#fafafa",
          100: "#f5f5f6",
          200: "#e9eaec",
          300: "#dfe1e5",
          400: "#c8cbd1",
          500: "#9ca3af",
          600: "#6b7280",
          700: "#4b5563",
          800: "#374151",
          900: "#1f2937",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(17, 24, 39, 0.06)",
        soft: "0 1px 4px rgba(17, 24, 39, 0.05)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
