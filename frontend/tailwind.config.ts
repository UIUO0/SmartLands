import type { Config } from "tailwindcss";

const config: Config = {
  // هذا السطر هو الأهم، هو الذي يخبر تيلوند أين توجد ملفاتك
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F1F3E0",       // بيج فاتح
        foreground: "#000000",       // أسود
        card: "#D2DCB6",             // أخضر فاتح
        primary: "#A1BC98",          // أخضر عشبي
        secondary: "#E2E8D5",
        border: "#A1BC98",
      },
    },
  },
  plugins: [],
};

export default config;