"use client"


import { Search, MapPin } from "lucide-react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { SAUDI_CITIES } from "@/lib/constants"
import { CitySelector } from "@/components/city-selector"

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Local state for delay debounce or direct control could be better, 
  // but for simplicity we will trigger on change or blur.
  // Using direct URL updates for now to keep it simple as per previous pattern.

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleCityChange = (city: string) => {
    const params = new URLSearchParams(searchParams);
    if (city && city !== "All Cities") {
      params.set('city', city);
    } else {
      params.delete('city');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleAreaChange = (type: 'min' | 'max', value: string) => {
    const params = new URLSearchParams(searchParams);
    const key = type === 'min' ? 'min_area' : 'max_area';

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
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
            defaultValue={searchParams.get('q')?.toString()}
            onChange={(e) => handleSearch(e.target.value)}
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
              defaultValue={searchParams.get('min_area')?.toString()}
              onChange={(e) => handleAreaChange('min', e.target.value)}
            />
          </div>
          <div className="flex items-center bg-secondary/30 rounded-xl px-4 py-3 w-[120px] transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
            <span className="text-gray-400 text-xs mr-2 font-medium">Max</span>
            <input
              type="number"
              placeholder="M²"
              className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400 text-sm"
              defaultValue={searchParams.get('max_area')?.toString()}
              onChange={(e) => handleAreaChange('max', e.target.value)}
            />
          </div>
        </div>

        {/* City & Button */}
        <div className="flex gap-2 shrink-0">
          <div className="w-[180px]">
            <CitySelector
              value={searchParams.get('city') || ""}
              onChange={handleCityChange}
              placeholder="All Cities"
              className="" // Custom wrapper classes if needed
            />
          </div>

          <button className="bg-primary text-black font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 shadow-sm whitespace-nowrap">
            Search
          </button>
        </div>

      </div>
    </div>
  )
}