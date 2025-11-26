"use client";

import { useEffect, useState } from "react";

// تعريف النوع لترتيب الكود (اختياري لكن أفضل من any)
type Land = {
  land_id?: number;
  id?: number;
  title?: string;
  name?: string;
  city?: string;
  price_amount?: number;
  area_sq_m?: number;
  description?: string;
  status?: string;
};

export default function MyLandsPage() {
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // ⚠️ ملاحظة: تأكد أن هذا الرابط يجلب أراضي المستخدم فقط
      // حسب مستند سعد قد يكون: /api/lands/me/mine أو مشابه
      const r = await fetch("/api/lands", { cache: "no-store" });
      
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      
      const j = await r.json();
      // التعامل مع الباجينيشن أو المصفوفة المباشرة
      setData(Array.isArray(j) ? j : j?.items ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    // الخلفية الأساسية: F1F3E0
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans">
      
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* --- HEADER --- */}
        {/* خلفية الهيدر: D2DCB6 */}
        <header className="rounded-3xl bg-[#D2DCB6] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#A1BC98]/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              My Lands
            </h1>
            <p className="text-[#3a4430] mt-1 font-medium">
              إدارة العقارات الخاصة بك (عرض، تعديل، حذف)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* زر التحديث: لون التمييز A1BC98 */}
            <button 
              onClick={load} 
              className="px-6 py-3 rounded-xl bg-[#A1BC98] text-black font-bold hover:bg-[#8ea885] transition shadow-sm"
            >
              تحديث القائمة
            </button>
            
            {/* زر إضافة (شكلي حالياً): أسود للتمييز */}
            <button 
              className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-[#333] transition shadow-md flex items-center gap-2"
            >
              <span>+</span> إضافة أرض جديدة
            </button>
          </div>
        </header>

        {/* --- LOADING & ERROR --- */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A1BC98] border-r-transparent mb-2"></div>
            <div className="text-[#556b4d] font-medium">جارِ تحميل عقاراتك...</div>
          </div>
        )}

        {err && (
          <div className="rounded-2xl bg-red-50 p-6 border border-red-200 text-red-700 text-center font-medium">
            حدث خطأ أثناء جلب البيانات: {err}
          </div>
        )}

        {/* --- CARDS GRID --- */}
        {!loading && !err && (
          <>
            {data.length === 0 ? (
              // حالة القائمة الفارغة
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#D2DCB6]/30 border-2 border-dashed border-[#A1BC98]">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-xl font-bold text-[#3a4430]">لا توجد أراضي مضافة</h3>
                <p className="text-[#556b4d] mt-2">ابدأ بإضافة أول عقار لك لعرضه للبيع.</p>
              </div>
            ) : (
              // شبكة البطاقات
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((x, i) => (
                  <article 
                    key={x.id ?? x.land_id ?? i} 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#D2DCB6] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[#A1BC98]/30"
                  >
                    <div>
                      {/* الحالة (مباع، متاح، إلخ) */}
                      <div className="flex justify-between items-start mb-3">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                           x.status === 'sold' ? 'bg-red-100 text-red-700 border-red-200' : 
                           x.status === 'reserved' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                           'bg-[#F1F3E0] text-black border-[#A1BC98]'
                         }`}>
                           {x.status || 'Available'}
                         </span>
                         <span className="text-xs text-[#3a4430] font-mono">
                           ID: {x.id ?? x.land_id}
                         </span>
                      </div>

                      <h3 className="font-bold text-xl text-black mb-1 line-clamp-1">
                        {x.title || x.name || `Land #${i + 1}`}
                      </h3>

                      <div className="text-sm text-[#3a4430] font-medium mb-4 flex items-center gap-2">
                         <span>📍 {x.city || "غير محدد"}</span>
                         {x.area_sq_m && <span>• 📐 {x.area_sq_m} م²</span>}
                      </div>
                      
                      {/* السعر */}
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-black">
                          {x.price_amount ? x.price_amount.toLocaleString() : "---"} 
                        </span>
                        <span className="text-sm font-medium text-[#3a4430]"> ر.س</span>
                      </div>
                    </div>

                    {/* أزرار التحكم (تعديل / حذف) */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/5">
                      <button className="rounded-xl bg-white border border-[#A1BC98] py-2 text-sm font-bold text-black hover:bg-[#A1BC98] transition">
                        تعديل
                      </button>
                      <button className="rounded-xl bg-red-50 border border-red-200 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition">
                        حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}