"use client"



import { Search, MapPin } from "lucide-react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { SAUDI_CITIES } from "@/lib/constants"
import { CitySelector } from "@/components/city-selector"
import { useState, useEffect } from "react"

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Local state for inputs
  const [term, setTerm] = useState(searchParams.get('q')?.toString() || "")
  const [city, setCity] = useState(searchParams.get('city')?.toString() || "")
  const [minArea, setMinArea] = useState(searchParams.get('min_area')?.toString() || "")
  const [maxArea, setMaxArea] = useState(searchParams.get('max_area')?.toString() || "")

  // Sync with URL when it changes (e.g. back button)
  useEffect(() => {
    setTerm(searchParams.get('q')?.toString() || "")
    setCity(searchParams.get('city')?.toString() || "")
    setMinArea(searchParams.get('min_area')?.toString() || "")
    setMaxArea(searchParams.get('max_area')?.toString() || "")
  }, [searchParams])

  const handleSearchClick = () => {
    const params = new URLSearchParams(searchParams);

    // Search Term
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }

    // City
    if (city && city !== "All Cities") {
      params.set('city', city);
    } else {
      params.delete('city');
    }

    // Min Area
    if (minArea) {
      params.set('min_area', minArea);
    } else {
      params.delete('min_area');
    }

    // Max Area
    if (maxArea) {
      params.set('max_area', maxArea);
    } else {
      params.delete('max_area');
    }

    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-3 border border-primary/30 shadow-sm mb-8">
      <div className="flex flex-col xl:flex-row gap-2">

        {/* Search Input */}
        <div className="flex-1 flex items-center bg-secondary/30 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
          <Search className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search lands..."
            className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400 min-w-[100px]"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        {/* Size Filters */}
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center bg-secondary/30 rounded-xl px-4 py-3 w-[120px] transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
            <span className="text-gray-400 text-xs mr-2 font-medium">Min</span>
            <input
              type="number"
              placeholder="M²"
              className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400 text-sm"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-secondary/30 rounded-xl px-4 py-3 w-[120px] transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
            <span className="text-gray-400 text-xs mr-2 font-medium">Max</span>
            <input
              type="number"
              placeholder="M²"
              className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400 text-sm"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
        </div>

        {/* City & Button */}
        <div className="flex gap-2 shrink-0">
          <div className="w-[180px]">
            <CitySelector
              value={city}
              onChange={(val) => setCity(val)}
              placeholder="All Cities"
              className=""
            />
          </div>

          <button
            onClick={handleSearchClick}
            className="bg-primary text-black font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 shadow-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>

      </div>
    </div>
  )
}