"use client";

import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PropertyGrid } from "@/components/property-grid";
import { SearchBar } from "@/components/search-bar";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("first_time") === "true") {
      // عرض رسالة ترحيبية
      alert("🎉 أهلاً بك! بما أنك سجلت الدخول عبر جوجل، ليس لديك كلمة مرور حالياً. يمكنك تعيين واحدة من صفحة الملف الشخصي إذا أردت.");

      // إزالة العلامة من الرابط حتى لا تظهر الرسالة مرة أخرى عند التحديث
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Discover Your Perfect Land</h1>

            {/* Suspense Boundary */}
            <Suspense fallback={<div>Loading search...</div>}>
              <SearchBar />
            </Suspense>

            <PropertyGrid />
          </div>
        </div>
      </main>
    </div>
  )
}