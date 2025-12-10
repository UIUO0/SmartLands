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
        // 1. جلب قائمة الأراضي (نصوص فقط)
        const res = await fetch("/api/lands", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch lands");

        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.data || data.items || []);

        // 2. الدوران على كل أرض لجلب صورتها الخاصة
        const landsWithImages = await Promise.all(rawList.map(async (land: any) => {
            // إذا كانت الأرض تملك صورة مسبقاً، لا داعي للتعب
            if (land.image_url) return land;

            try {
                // نطلب الصور الخاصة بهذه الأرض
                const landId = land.id || land.land_id;
                // 👇 هذا الرابط يحتاج لملف في الخطوة 2 ليعمل
                const imgRes = await fetch(`/api/lands/${landId}/images`); 
                
                if (imgRes.ok) {
                    const images = await imgRes.json();
                    // نبحث عن صورة الغلاف أو نأخذ أول صورة
                    const cover = images.find((img: any) => img.is_cover) || images[0];
                    if (cover) {
                        return { ...land, image_url: cover.file_url }; 
                    }
                }
            } catch (e) {
                console.warn(`No image for land ${land.id}`);
            }
            return land;
        }));

        setLands(landsWithImages);
        
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-20">
      {lands.map((land: any) => (
        <PropertyCard 
          key={land.id || land.land_id} 
          property={{
            id: land.id || land.land_id,
            title: land.title || land.name || "Untitled Land", 
            location: land.city || land.location || "Riyadh",
            price: land.price_amount || land.price || 0,
            // استخدام الصورة التي جلبناها أو الافتراضية
            image: land.image_url || "/placeholder.svg", 
            sqft: land.area_sq_m || land.area || 0,
            status: land.status || "For Sale",
            beds: 0,
            baths: 0,
          }} 
        />
      ))}
    </div>
  )
}