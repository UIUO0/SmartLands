"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation" // 👈 إضافة مهمة
import { PropertyCard } from "./property-card"
import { Loader2 } from "lucide-react"

export function PropertyGrid() {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 1. مراقبة الرابط
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchLands() {
      try {
        setLoading(true);
        // 2. تحويل بارامترات الرابط إلى نص (مثلاً ?q=test&city=Riyadh)
        const query = searchParams.toString();
        
        // 3. إرسال الطلب مع الفلاتر
        const res = await fetch(`/api/lands?${query}`, { cache: "no-store" });
        
        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data) ? data : (data.data || data.items || []);
          
          // جلب الصور (الكود الذي يعمل معك حالياً)
          const landsWithImages = await Promise.all(rawList.map(async (land: any) => {
             if (land.image_url) return land;
             try {
                // ملاحظة: إذا كان الباك إند يرجع الصورة مع البحث، لن يحتاج لهذا، لكن سنبقيه للاحتياط
                if(land.cover_image?.file_url) return { ...land, image_url: land.cover_image.file_url };
                // ... كود جلب الصور الإضافي إن لزم ...
             } catch(e) {}
             return land;
          }));
          
          setLands(landsWithImages);
        } else {
            // في حال الخطأ نصفر القائمة
            setLands([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLands()
    
    // 4. إعادة التشغيل كلما تغير البحث
  }, [searchParams]) 

  if (loading) return (
    <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  
  if (lands.length === 0 && !loading) {
      return (
          <div className="text-center py-20 text-gray-500">
              No lands found matching your search.
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-20">
      {lands.map((land: any) => (
        <PropertyCard 
          key={land.id || land.land_id} 
          property={{
            id: land.id || land.land_id,
            title: land.title || land.name || "Untitled", 
            location: land.city || land.location || "Riyadh",
            price: land.price_amount || land.price || 0,
            image: land.image_url || land.cover_image?.file_url || "/placeholder.svg", 
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