"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { Plus, MapPin, Ruler, Tag, Trash2, Edit, X, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyLandsPage() {
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات النافذة المنبثقة (Add Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // نموذج إضافة الأرض
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_amount: "",
    area_sq_m: "",
    city: "Riyadh",
    region: "",
    address_line: "",
    // إحداثيات افتراضية للرياض
    latitude: 24.7136, 
    longitude: 46.6753
  });

  const router = useRouter();

  useEffect(() => {
    fetchMyLands();
  }, []);

  async function fetchMyLands() {
    try {
      const res = await fetch("/api/lands/mine");
      if (res.status === 401) {
          router.push("/login");
          return;
      }
      if (res.ok) {
        const data = await res.json();
        setLands(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // تحويل الأرقام لنوع number
    const payload = {
        ...formData,
        price_amount: Number(formData.price_amount),
        area_sq_m: Number(formData.area_sq_m),
        country: "SA" // ثابت حالياً
    };

    try {
        const res = await fetch("/api/lands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ تمت إضافة الأرض بنجاح!");
            setIsModalOpen(false);
            setFormData({ ...formData, title: "", description: "", price_amount: "", area_sq_m: "" }); // تصفير الحقول
            fetchMyLands(); // تحديث القائمة
        } else {
            const err = await res.json();
            alert("❌ فشل الإضافة: " + (err.detail || "تأكد من البيانات"));
        }
    } catch (e) {
        alert("خطأ في الاتصال");
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black flex items-center gap-2">
                    <MapPin className="h-8 w-8"/> أراضيّ المعروضة
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-[#333] transition flex items-center gap-2 shadow-lg"
                >
                    <Plus className="h-5 w-5"/> إضافة أرض جديدة
                </button>
            </div>

            {loading ? (
                 <div className="text-center py-20 text-[#556b4d] animate-pulse">جارِ تحميل عقاراتك...</div>
            ) : lands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-[#D2DCB6] p-6 rounded-full mb-4">
                        <MapPin className="h-10 w-10 text-black/50"/>
                    </div>
                    <h2 className="text-xl font-bold mb-2">لا تملك أي أراضي معروضة حالياً</h2>
                    <p className="text-gray-500 mb-6">ابدأ بإضافة أول عقار لك ليتمكن المشترون من العثور عليه.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-[#556b4d] font-bold underline">إضافة أرض الآن</button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {lands.map((land) => (
                        <div key={land.land_id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#A1BC98]/30 group hover:border-[#A1BC98] transition">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-xl truncate">{land.title}</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${land.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    {land.status}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                                {land.description || "لا يوجد وصف"}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm font-medium text-[#556b4d] mb-4">
                                <span className="flex items-center gap-1"><Ruler className="h-4 w-4"/> {land.area_sq_m} م²</span>
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {land.city}</span>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <span className="font-bold text-lg">{Intl.NumberFormat('en-US').format(land.price_amount)} ر.س</span>
                                <Link href={`/lands/${land.land_id}`} className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-[#333]">
                                    التفاصيل
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* === Modal إضافة أرض === */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-[#F1F3E0] w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 border-b border-[#A1BC98]/30 pb-4">
                        <h2 className="text-2xl font-bold">إضافة عقار جديد</h2>
                        <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 hover:text-red-500"/></button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">عنوان الإعلان</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]" 
                                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: أرض سكنية في حي الملقا"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">السعر (ر.س)</label>
                                <input required type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]" 
                                    value={formData.price_amount} onChange={e => setFormData({...formData, price_amount: e.target.value})} placeholder="500000"/>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">المساحة (م²)</label>
                                <input required type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]" 
                                    value={formData.area_sq_m} onChange={e => setFormData({...formData, area_sq_m: e.target.value})} placeholder="450"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">المدينة</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]" 
                                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">التفاصيل والوصف</label>
                            <textarea required rows={4} className="w-full p-3 rounded-xl border border-[#A1BC98]" 
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="اكتب وصفاً مميزاً للأرض..."/>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#333] transition flex justify-center items-center gap-2 mt-4"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : <Save className="h-5 w-5"/>}
                            نشر الإعلان
                        </button>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}