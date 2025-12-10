"use client";

import { Suspense } from "react"; 
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PropertyGrid } from "@/components/property-grid";
import { SearchBar } from "@/components/search-bar";

export default function DashboardPage() {
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