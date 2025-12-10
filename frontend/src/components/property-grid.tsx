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
          // التعامل مع البيانات
          const list = Array.isArray(data) ? data : (data.data || data.items || []);
          setLands(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLands()
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    // 👇 هذا الكود المسؤول عن وضع 3 بطاقات بجانب بعض
    // grid-cols-1 (للجوال) -> grid-cols-3 (للشاشات الكبيرة)
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-20">
      {lands.map((land: any) => {
        // البحث عن رابط الصورة الصحيح
        // نحاول العثور على صورة الغلاف، أو أول صورة، أو نستخدم صورة افتراضية
        let imageUrl = "/placeholder.svg";
        
        if (land.image_url) imageUrl = land.image_url;
        else if (land.cover_image?.file_url) imageUrl = land.cover_image.file_url;
        else if (land.images && land.images.length > 0) imageUrl = land.images[0].file_url;

        return (
          <PropertyCard 
            key={land.id || land.land_id} 
            property={{
              id: land.id || land.land_id,
              title: land.title || land.name || "Untitled Land", 
              location: land.city || land.location || "Riyadh",
              price: land.price_amount || land.price || 0,
              image: imageUrl, 
              sqft: land.area_sq_m || land.area || 0,
              status: land.status || "For Sale",
              beds: 0,
              baths: 0,
            }} 
          />
        )
      })}
    </div>
  )
}