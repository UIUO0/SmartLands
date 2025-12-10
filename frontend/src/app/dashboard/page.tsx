"use client";

import { Suspense } from "react"; // 1. استيراد Suspense ضروري جداً
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PropertyGrid } from "@/components/property-grid";
import { SearchBar } from "@/components/search-bar";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground bg-[#F1F3E0]">
      {/* القائمة الجانبية */}
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-black">
                Discover Your Perfect Land
              </h1>
              <p className="text-gray-600 text-lg">
                Browse our exclusive selection of premium real estate listings
              </p>
            </div>

            {/* 2. تغليف SearchBar بـ Suspense هو الحل للمشكلة */}
            <Suspense fallback={<div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>}>
                <SearchBar />
            </Suspense>

            <PropertyGrid />
            
          </div>
        </div>
      </main>
    </div>
  )
}