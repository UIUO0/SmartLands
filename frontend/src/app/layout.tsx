import "./globals.css";
import type { Metadata } from "next";
import { GoogleAuthProvider } from  "@/components/GoogleProvider"; // 👈 استدعاء الغلاف الجديد

export const metadata: Metadata = {
  title: "Smart Lands",
  description: "Smart Lands Frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* قمنا بإحاطة الأطفال بالبروفايدر 
            ليتمكن أي زر تسجيل دخول في الموقع من الوصول لجوجل 
        */}
        <GoogleAuthProvider>
           {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}