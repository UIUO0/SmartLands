"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // لتحديث الصفحة بعد الإضافة

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
  const router = useRouter();
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- حالات المودال (النافذة المنبثقة) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // بيانات النموذج الجديد
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    city: "",
    price_amount: "",
    area_sq_m: "",
    address_line: "", 
    // قيم افتراضية مطلوبة من الباك إند (يمكنك إضافة حقول لها لاحقاً)
    region: "Riyadh", 
    country: "Saudi Arabia",
    latitude: 0,
    longitude: 0
  });

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/lands", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(Array.isArray(j) ? j : j?.items ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // دالة إرسال النموذج
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_amount: Number(formData.price_amount), // تحويل لأرقام
          area_sq_m: Number(formData.area_sq_m),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "فشل إضافة الأرض");
      }

      // نجاح!
      setIsModalOpen(false); // إغلاق النافذة
      setFormData({ ...formData, title: "", description: "", price_amount: "", area_sq_m: "", city: "" }); // تصفير
      load(); // تحديث القائمة
      alert("تمت إضافة الأرض بنجاح! 🎉");

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans relative">
      
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* --- HEADER --- */}
        <header className="rounded-3xl bg-[#D2DCB6] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#A1BC98]/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">My Lands</h1>
            <p className="text-[#3a4430] mt-1 font-medium">إدارة العقارات الخاصة بك</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={load} className="px-6 py-3 rounded-xl bg-[#A1BC98] text-black font-bold hover:bg-[#8ea885] transition shadow-sm">
              تحديث القائمة
            </button>
            
            {/* ✅ زر فتح المودال */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-[#333] transition shadow-md flex items-center gap-2"
            >
              <span>+</span> إضافة أرض جديدة
            </button>
          </div>
        </header>

        {/* --- LOADING & ERROR --- */}
        {loading && <div className="text-center py-12 text-[#556b4d]">جارِ التحميل...</div>}
        {err && <div className="rounded-2xl bg-red-50 p-6 text-red-700 text-center">{err}</div>}

        {/* --- CARDS GRID --- */}
        {!loading && !err && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((x, i) => (
              <article key={x.id ?? x.land_id ?? i} className="rounded-3xl bg-[#D2DCB6] p-5 shadow-sm border border-[#A1BC98]/30">
                 <h3 className="font-bold text-xl">{x.title}</h3>
                 <div className="text-sm text-[#3a4430]">{x.city} • {x.price_amount?.toLocaleString()} ر.س</div>
              </article>
            ))}
            {data.length === 0 && <div className="text-center col-span-full py-10 text-[#556b4d]">لا توجد أراضي</div>}
          </div>
        )}
      </div>

      {/* ================= MODAL (النافذة المنبثقة) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#F1F3E0] rounded-3xl shadow-2xl overflow-hidden border border-[#A1BC98]">
            
            {/* Modal Header */}
            <div className="bg-[#D2DCB6] p-6 border-b border-[#A1BC98] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">إضافة عقار جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-black/50 hover:text-black text-2xl font-bold">&times;</button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* العنوان */}
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-1">عنوان الأرض</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                    placeholder="مثال: أرض سكنية في حي الملقا"
                  />
                </div>

                {/* السعر */}
                <div>
                  <label className="block text-sm font-bold mb-1">السعر (ر.س)</label>
                  <input 
                    required type="number"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({...formData, price_amount: e.target.value})}
                    className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                    placeholder="0"
                  />
                </div>

                {/* المساحة */}
                <div>
                  <label className="block text-sm font-bold mb-1">المساحة (م²)</label>
                  <input 
                    required type="number"
                    value={formData.area_sq_m}
                    onChange={(e) => setFormData({...formData, area_sq_m: e.target.value})}
                    className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                    placeholder="0"
                  />
                </div>

                {/* المدينة */}
                <div>
                  <label className="block text-sm font-bold mb-1">المدينة</label>
                  <input 
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                    placeholder="الرياض"
                  />
                </div>

                {/* الحي / العنوان */}
                <div>
                   <label className="block text-sm font-bold mb-1">الحي / العنوان</label>
                   <input 
                     value={formData.address_line}
                     onChange={(e) => setFormData({...formData, address_line: e.target.value})}
                     className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                     placeholder="شارع العليا..."
                   />
                </div>
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-bold mb-1">الوصف</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 focus:border-[#A1BC98] outline-none"
                  placeholder="اكتب وصفاً مميزاً للأرض..."
                />
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-black py-3 text-white font-bold hover:bg-[#333] disabled:opacity-50 transition"
                >
                  {isSubmitting ? "جارِ الحفظ..." : "حفظ الأرض"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-transparent border-2 border-black/10 px-6 py-3 font-bold hover:bg-black/5 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}