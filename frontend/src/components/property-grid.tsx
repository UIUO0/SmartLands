"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "./property-card"
import { Loader2 } from "lucide-react"

export function PropertyGrid() {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLands() {
      try {
        const res = await fetch("/api/lands", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // التعامل مع اختلاف هيكل البيانات
          const list = Array.isArray(data) ? data : (data.data || data.items || []);
          
          // جلب الصور (اختياري لتحسين الأداء يمكن تأجيله)
          const landsWithImages = await Promise.all(list.map(async (land: any) => {
             // ... (نفس منطق جلب الصور السابق) ...
             // للاختصار، سنعرض البيانات كما هي الآن للتأكد من التصميم
             return land;
          }));
          setLands(landsWithImages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLands()
  }, [])

  if (loading) return <div className="p-10 text-center">Loading...</div>

  // 👇 لاحظ هنا: استخدام grid-cols-3 بشكل صريح مع gap
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {lands.map((land: any) => (
        <PropertyCard 
          key={land.id || land.land_id} 
          property={{
            id: land.id || land.land_id,
            title: land.title || land.name || "Untitled", 
            location: land.city || "Riyadh",
            price: land.price_amount || 0,
            image: land.image_url || "/placeholder.svg", 
            sqft: land.area_sq_m || 0,
            status: "For Sale",
            beds: 0, baths: 0
          }} 
        />
      ))}
    </div>
  )
}