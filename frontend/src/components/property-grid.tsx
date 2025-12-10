"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "./property-card"
import { Loader2 } from "lucide-react"

export function PropertyGrid() {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchLands() {
      try {
        setLoading(true);
        console.log("Fetching Public Lands..."); // فحص في الكونسول

        // 1. طلب بيانات السوق العام فقط (لضمان ظهورها)
        const res = await fetch("/api/lands", { cache: "no-store" });
        
        if (!res.ok) {
            console.error("Failed to fetch public lands:", res.status);
            throw new Error("Failed to fetch lands");
        }

        const data = await res.json();
        console.log("Public Data Received:", data); // لنرى شكل البيانات

        // معالجة البيانات (قد تكون مصفوفة مباشرة أو داخل كائن data/items)
        const rawList = Array.isArray(data) ? data : (data.data || data.items || []);

        // 2. جلب الصور لكل أرض (لأن الباك-إند يفصل الصور عن بيانات الأرض)
        const landsWithImages = await Promise.all(rawList.map(async (land: any) => {
            // إذا كانت الأرض تحتوي بالفعل على صورة، لا داعي لجلبها
            if (land.image_url || land.cover_image?.file_url) return land;

            try {
                const landId = land.land_id || land.id;
                // نطلب صور الأرض المحددة
                const imgRes = await fetch(`/api/lands/${landId}/images`);
                if (imgRes.ok) {
                    const images = await imgRes.json();
                    // نأخذ صورة الغلاف أو أول صورة
                    const cover = images.find((img: any) => img.is_cover) || images[0];
                    if (cover) {
                        return { ...land, image_url: cover.file_url }; 
                    }
                }
            } catch (e) {
                console.warn(`Could not fetch image for land ${land.id}`);
            }
            return land;
        }));

        setLands(landsWithImages);
        
      } catch (err) {
        console.error("Grid Error:", err)
        setError("Unable to load market properties.")
      } finally {
        setLoading(false)
      }
    }

    fetchLands()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>
  }

  if (lands.length === 0) {
    return (
      <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-dashed border-border">
        <p className="text-muted-foreground text-lg font-medium">No properties found in the market.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-10">
      {lands.map((land: any) => (
        <PropertyCard 
          key={land.id || land.land_id} 
          property={{
            id: land.id || land.land_id,
            title: land.title || land.name || "Untitled Land", 
            location: land.city || land.location || "Unknown Location",
            price: land.price_amount || land.price || 0,
            // منطق عرض الصورة: الرابط الجديد، أو الموجود سابقاً، أو صورة افتراضية
            image: land.image_url || land.cover_image?.file_url || "/placeholder.svg",
            sqft: land.area_sq_m || land.area || land.sqft || 0,
            status: land.status || "For Sale",
            beds: 0,
            baths: 0,
          }} 
        />
      ))}
    </div>
  )
}