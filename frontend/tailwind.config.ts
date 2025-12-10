import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ألوان Smart Lands الرسمية
        background: "#F1F3E0",       // الخلفية الكريمي
        foreground: "#000000",       // النصوص
        
        card: "#D2DCB6",             // لون البطاقات والسايدبار (أخضر فاتح)
        "card-foreground": "#000000",
        
        primary: "#A1BC98",          // لون الأزرار والتمييز (أخضر عشبي)
        "primary-foreground": "#000000",
        
        secondary: "#E2E8D5",        // لون العناصر الثانوية
        "secondary-foreground": "#3a4430",
        
        muted: "#9CA3AF",
        border: "#A1BC98",           // لون الحدود
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;