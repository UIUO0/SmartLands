"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAbsoluteImageUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

type LandDetail = {
  land_id: number;
  title: string;
  description?: string;
  price_amount?: number;
  area_sq_m?: number;
  city?: string;
  region?: string;
  status?: "available" | "reserved" | "sold";
  owner_id?: number;
  country?: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
};

export default function LandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [land, setLand] = useState<LandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState("");

  // Gallery State
  const [images, setImages] = useState<string[]>([]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // 1. جلب تفاصيل الأرض
  useEffect(() => {
    async function loadData() {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

        // Fetch Land
        const res = await fetch(`${BASE}/lands/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status === 404 ? "Land not found" : "Error");
        const rawData = await res.json();
        console.log("🏞️ Land Data Raw:", rawData);

        let validLand = rawData;
        if (rawData.data) validLand = rawData.data;
        else if (rawData.land) validLand = rawData.land;
        else if (rawData.item) validLand = rawData.item;

        setLand(validLand);

        // Fetch Images specifically for this land
        try {
          const imgsRes = await fetch(`/api/lands/${id}/images`);
          if (imgsRes.ok) {
            const imgsData = await imgsRes.json();
            // Extract urls from the object array
            const urls = imgsData.map((img: any) => img.file_url).filter(Boolean);
            if (urls.length > 0) {
              setImages(urls);
            } else if (validLand.picture_url || validLand.image_url) {
              setImages([validLand.picture_url || validLand.image_url]);
            }
          }
        } catch (e) {
          console.error("Failed to fetch additional images", e);
          // Fallback to main image if exists
          if (validLand.picture_url || validLand.image_url) {
            setImages([validLand.picture_url || validLand.image_url]);
          }
        }

      } catch {
        setMsg("تعذر تحميل بيانات الأرض");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  // 2. دالة إرسال طلب الشراء
  async function handleRequestBuy() {
    if (!confirm("هل أنت متأكد من إرسال طلب شراء للمالك؟")) return;

    setRequestStatus('loading');
    setMsg("");

    try {
      const res = await fetch(`/api/lands/${id}/request`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "فشل الطلب");
      }

      setRequestStatus('success');
      setMsg("✅ تم إرسال الطلب للمالك بنجاح! سيتم فتح الدردشة عند القبول.");
    } catch (e: any) {
      setRequestStatus('error');
      setMsg("❌ حدث خطأ: " + (e.message || "فشل الإرسال"));
    }
  }


  if (loading) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center text-[#556b4d] animate-pulse">جارِ التحميل...</div>;

  if (!land) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center">لم يتم العثور على الأرض</div>;

  return (
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans p-6 relative">
      <div className="max-w-4xl mx-auto space-y-6">

        <button onClick={() => router.back()} className="text-[#556b4d] font-bold hover:underline mb-4">
          ← عودة للقائمة
        </button>

        <article className="bg-[#D2DCB6] rounded-3xl p-8 shadow-sm border border-[#A1BC98]/50">
          {/* رأس الصفحة */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black mb-2">{land.title}</h1>
              <p className="text-[#3a4430] font-medium">📍 {land.city} {land.region && `- ${land.region}`}</p>
            </div>

            <div className="flex flex-col gap-2 items-end">
              {land.price_amount && (
                <div className="bg-[#F1F3E0] px-5 py-3 rounded-2xl shadow-sm text-center min-w-[150px]">
                  <p className="text-xs text-gray-500 font-bold uppercase">السعر المطلوب</p>
                  <p className="text-2xl font-bold text-black">{Intl.NumberFormat("ar-SA").format(land.price_amount)} ر.س</p>
                </div>
              )}
            </div>
          </div>


          {/* صورة العقار */}
          {/* صورة العقار / المعرض */}
          <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-6 bg-gray-200 border border-[#A1BC98]/30 group">
            {images.length > 0 ? (
              <>
                <img
                  src={getAbsoluteImageUrl(images[currentImgIndex])}
                  alt={land.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />

                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-2 rounded-full transition-all ${idx === currentImgIndex ? "bg-white w-4" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                <span>لا توجد صور</span>
              </div>
            )}

            {/* Status Badge */}
            <span className={`absolute top-4 right-4 text-sm font-bold px-3 py-1.5 rounded-xl shadow-sm z-10 ${land.status === 'available' ? 'bg-white text-green-700' : 'bg-gray-800 text-white'}`}>
              {land.status === 'available' ? 'متاح' : land.status}
            </span>
          </div>


          {/* التفاصيل والوصف */}
          <div className="bg-white/40 p-6 rounded-2xl border border-[#A1BC98]/30 mb-8">
            <div className="flex gap-4 mb-4 text-sm font-semibold text-[#556b4d]">
              <span>📐 المساحة: {land.area_sq_m} م²</span>
              <span>🏷️ الحالة: {land.status === 'available' ? 'متاح' : land.status}</span>
            </div>
            <p className="text-black/80 leading-relaxed whitespace-pre-wrap">
              {land.description || "لا يوجد وصف."}
            </p>
          </div>

          {/* منطقة الإجراءات Feedback & Actions - للمشتري فقط */}
          <div className="border-t border-[#A1BC98]/30 pt-6">

            {/* رسائل التنبيه للمشتري */}
            {msg && (
              <div className={`p-4 rounded-xl mb-4 text-center font-bold ${requestStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {msg}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {requestStatus === 'success' ? (
                <button
                  onClick={() => router.push("/chats")}
                  className="bg-black text-white font-bold py-3 px-8 rounded-xl hover:bg-[#333] transition"
                >
                  الذهاب للدردشات 💬
                </button>
              ) : (
                <button
                  onClick={handleRequestBuy}
                  disabled={requestStatus === 'loading' || land.status !== 'available'}
                  className="bg-[#A1BC98] hover:bg-[#8ea885] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl transition shadow-sm w-full md:w-auto"
                >
                  {requestStatus === 'loading' ? 'جارِ الإرسال...' : 'إرسال طلب شراء 📝'}
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}