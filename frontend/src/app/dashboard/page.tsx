"use client";

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { PropertyGrid } from "@/components/property-grid"
import { SearchBar } from "@/components/search-bar"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {/* القائمة الجانبية */}
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold">
                Discover Your Perfect Land
              </h1>
              <p className="text-gray-600 text-lg">
                Browse our exclusive selection of premium real estate listings
              </p>
            </div>

            <SearchBar />

            <PropertyGrid />
            
          </div>
        </div>
      </main>
    </div>
  )
}