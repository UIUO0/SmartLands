"use client"

import { Search, MapPin } from "lucide-react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // دالة البحث: تتحدث مع الـ URL
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set('q', term); // إضافة كلمة البحث حسب توثيق الباك إند
    } else {
      params.delete('q');
    }

    // تحديث الرابط بدون إعادة تحميل الصفحة
    replace(`${pathname}?${params.toString()}`);
  }

  // فلتر المدينة (اختياري)
  const handleCityChange = (city: string) => {
    const params = new URLSearchParams(searchParams);
    if (city && city !== "All Cities") {
      params.set('city', city);
    } else {
      params.delete('city');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-3 border border-primary/30 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row gap-2">

        {/* حقل البحث النصي */}
        <div className="flex-1 flex items-center bg-secondary/30 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/50 focus-within:bg-secondary/50 focus-within:ring-1 focus-within:ring-primary/50">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search lands..."
            className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400"
            // نأخذ القيمة الحالية من الرابط
            defaultValue={searchParams.get('q')?.toString()}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* قائمة المدن */}
        <div className="flex gap-2">
          <div className="hidden sm:flex items-center bg-secondary/30 rounded-xl px-4 py-3 min-w-[140px] cursor-pointer hover:bg-secondary/50 relative">
            <MapPin className="h-5 w-5 text-gray-500 mr-2 absolute left-3 pointer-events-none" />
            <select
              onChange={(e) => handleCityChange(e.target.value)}
              defaultValue={searchParams.get('city')?.toString()}
              className="bg-transparent border-none outline-none text-gray-700 font-medium cursor-pointer w-full pl-6 appearance-none"
            >
              <option value="">All Cities</option>
              <option value="Riyadh">Riyadh</option>
              <option value="Jeddah">Jeddah</option>
              <option value="Dammam">Dammam</option>
            </select>
          </div>

          <button className="bg-primary text-black font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 shadow-sm">
            Search
          </button>
        </div>

      </div>
    </div>
  )
}