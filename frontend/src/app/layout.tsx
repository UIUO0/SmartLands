import "./globals.css"; // ✅ استدعاء ملف الستايل
import type { Metadata } from "next";
import { GoogleAuthProvider } from "@/components/GoogleProvider";

export const metadata: Metadata = {
  title: "Smart Lands",
  description: "Smart Lands Frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 👇 هنا التعديل المهم: أضفنا الكلاسات لتفعيل الخلفية والخط */}
      <body className="bg-background text-foreground font-sans antialiased">
        <GoogleAuthProvider>
            {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}