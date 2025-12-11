"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAbsoluteImageUrl } from "@/lib/utils";

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
};

export default function LandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [land, setLand] = useState<LandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState("");

  // 1. جلب تفاصيل الأرض
  useEffect(() => {
    async function loadData() {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";
        const res = await fetch(`${BASE}/lands/${id}`, { cache: "no-store" });

        if (!res.ok) throw new Error(res.status === 404 ? "Land not found" : "Error");

        setLand(await res.json());
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
      // Endpoint حسب التوثيق: POST /lands/{land_id}/request
      const res = await fetch(`/api/lands/${id}/request`, { // سنحتاج لعمل هذا الروت في الـ API Proxy
        method: "POST",
      });

      if (res.status === 401) {
        router.push("/login"); // توجيه لتسجيل الدخول إذا لم يكن مسجلاً
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
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <button onClick={() => router.back()} className="text-[#556b4d] font-bold hover:underline mb-4">
          ← عودة للقائمة
        </button>

        <article className="bg-[#D2DCB6] rounded-3xl p-8 shadow-sm border border-[#A1BC98]/50">
          {/* رأس الصفحة */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{land.title}</h1>
              <p className="text-[#3a4430] font-medium">📍 {land.city} {land.region && `- ${land.region}`}</p>
            </div>
            {land.price_amount && (
              <div className="bg-[#F1F3E0] px-5 py-3 rounded-2xl shadow-sm text-center min-w-[150px]">
                <p className="text-xs text-gray-500 font-bold uppercase">السعر المطلوب</p>
                <p className="text-2xl font-bold text-black">{Intl.NumberFormat("ar-SA").format(land.price_amount)} ر.س</p>
              </div>
            )}
          </div>


          {/* صورة العقار */}
          <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-6 bg-gray-200 border border-[#A1BC98]/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAbsoluteImageUrl((land as any).image || (land as any).cover_image_url || (land as any).picture_url)}
              alt={land.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
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

          {/* منطقة الإجراءات Feedback & Actions */}
          <div className="border-t border-[#A1BC98]/30 pt-6">

            {/* رسائل التنبيه */}
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