"use client"

import { Search, MapPin, SlidersHorizontal } from "lucide-react"
import { useState } from "react"

export function SearchBar() {
  const [query, setQuery] = useState("")

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-3 border border-border/40 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row gap-2">
        
        {/* حقل البحث النصي */}
        <div className="flex-1 flex items-center bg-secondary/30 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by city, neighborhood, or street..."
            className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* الفلاتر والأزرار */}
        <div className="flex gap-2">
            {/* فلتر الموقع (شكلي حالياً) */}
            <div className="hidden sm:flex items-center bg-secondary/30 rounded-xl px-4 py-3 min-w-[140px] cursor-pointer hover:bg-secondary/50">
              <MapPin className="h-5 w-5 text-gray-500 mr-2" />
              <select className="bg-transparent border-none outline-none text-gray-700 font-medium cursor-pointer w-full appearance-none">
                <option>All Cities</option>
                <option>Riyadh</option>
                <option>Jeddah</option>
                <option>Dammam</option>
              </select>
            </div>

            {/* زر البحث */}
            <button className="bg-primary text-black font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 shadow-sm">
              Search
            </button>
            
            {/* زر فلاتر إضافية */}
            <button className="p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors text-gray-700">
                <SlidersHorizontal className="h-6 w-6" />
            </button>
        </div>

      </div>
    </div>
  )
}