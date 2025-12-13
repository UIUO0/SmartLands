"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PropertyCard } from "./property-card"
import { Loader2 } from "lucide-react"

interface ApiLand {
  id?: string
  land_id?: string
  title?: string
  name?: string
  city?: string
  location?: string
  price_amount?: number
  price?: number
  area_sq_m?: number
  area?: number
  image_url?: string
  cover_image?: { file_url: string }
  status?: string
}

export function PropertyGrid() {
  const [lands, setLands] = useState<ApiLand[]>([])
  const [loading, setLoading] = useState(true)

  // 1. نستدعي هذا الهوك لمراقبة رابط الصفحة
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchLands() {
      try {
        setLoading(true);

        // 2. نأخذ الفلاتر من الرابط (مثل ?q=villa&city=Riyadh)
        const query = searchParams.toString();

        // 3. نطلب البيانات من الباك-إند مع الفلاتر
        const res = await fetch(`/api/lands?${query}`, { cache: "no-store" });

        if (res.ok) {
          const data = await res.json();
          const rawList: ApiLand[] = Array.isArray(data) ? data : (data.data || data.items || []);

          // 🛑 4. هذا هو الجزء الذي أعيدناه: جلب الصور لكل أرض 🛑
          const landsWithImages = await Promise.all(rawList.map(async (land) => {
            // محاولة استخراج الصورة من البيانات الأساسية أولاً
            if (land.image_url) return land;
            if (land.cover_image?.file_url) return { ...land, image_url: land.cover_image.file_url };

            try {
              // إذا لم توجد، نطلبها من الباك-إند عبر البروكسي الخاص بنا
              const landId = land.id || land.land_id;
              const imgRes = await fetch(`/api/lands/${landId}/images`);

              if (imgRes.ok) {
                const images = await imgRes.json();
                // نأخذ صورة الغلاف أو أول صورة
                const cover = images.find((img: any) => img.is_cover) || images[0];
                if (cover) {
                  return { ...land, image_url: cover.file_url };
                }
              }
            } catch {
              console.warn(`Could not fetch image for land ${land.id}`);
            }
            // إذا فشل كل شيء، نرجع الأرض كما هي (وستظهر الصورة الافتراضية في البطاقة)
            return land;
          }));

          setLands(landsWithImages);

          // Client-side filtering as backup (if backend ignores size params)
          const minArea = Number(searchParams.get('min_area')) || 0;
          const maxArea = Number(searchParams.get('max_area')) || Infinity;

          if (minArea > 0 || maxArea !== Infinity) {
            const filtered = landsWithImages.filter(land => {
              const area = land.area_sq_m || land.area || 0;
              if (minArea > 0 && area < minArea) return false;
              if (maxArea !== Infinity && area > maxArea) return false;
              return true;
            });
            setLands(filtered);
          } else {
            setLands(landsWithImages);
          }
        } else {
          setLands([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLands()

    // يعيد التحميل كلما تغير البحث
  }, [searchParams])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (lands.length === 0 && !loading) {
    return (
      <div className="text-center py-20 text-gray-500 text-lg">
        No lands found matching your search.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-20">
      {lands.map((land) => (
        <PropertyCard
          key={land.id || land.land_id}
          property={{
            id: land.id || land.land_id || "",
            title: land.title || land.name || "Untitled",
            location: land.city || land.location || "Riyadh",
            price: land.price_amount || land.price || 0,
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