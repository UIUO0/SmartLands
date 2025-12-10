"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Ruler, Coins, Plus, Edit2, Image as ImageIcon, ArrowLeft, ArrowRight } from "lucide-react"; // أيقونات اختيارية لتحسين الشكل

// تعريف الأنواع
type Land = {
  land_id?: number;
  id?: number;
  title?: string;
  city?: string;
  price_amount?: number;
  area_sq_m?: number;
  description?: string;
  status?: string;
  address_line?: string;
  cover_image?: { file_url: string };
  cover_image_url?: string;
};

export default function MyLandsPage() {
  const router = useRouter();
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- Modals State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form Data ---
  const [formData, setFormData] = useState({
    title: "", description: "", city: "", price_amount: "", area_sq_m: "", address_line: "", status: "for_sale"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. Fetch Data
  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/lands/mine", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      
      const landsData = await r.json();
      const items = Array.isArray(landsData) ? landsData : landsData?.items ?? [];

      const landsWithImages = await Promise.all(items.map(async (land: Land) => {
        try {
            const landId = land.land_id || land.id;
            const imgRes = await fetch(`/api/lands/${landId}/images`, { cache: 'no-store' });
            if (imgRes.ok) {
                const images = await imgRes.json();
                const cover = images.find((img: any) => img.is_cover) || images[0];
                if (cover) return { ...land, cover_image_url: cover.file_url };
            }
        } catch (e) { console.error(e); }
        return land;
      }));
      setData(landsWithImages);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // 2. Handlers (Create, Update, Upload) - نفس المنطق السابق تماماً
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_amount: Number(formData.price_amount),
          area_sq_m: Number(formData.area_sq_m),
          region: "Riyadh", country: "Saudi Arabia", latitude: 0, longitude: 0
        }),
      });
      if (!res.ok) throw new Error("فشل إضافة الأرض");
      setIsCreateOpen(false); load(); alert("تمت الإضافة بنجاح!");
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand) return;
    setIsSubmitting(true);
    const landId = selectedLand.land_id || selectedLand.id;
    try {
      const res = await fetch(`/api/lands/${landId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, description: formData.description,
          price_amount: Number(formData.price_amount), status: formData.status,
        }),
      });
      if (!res.ok) throw new Error("فشل التعديل");
      setIsEditOpen(false); setSelectedLand(null); load(); alert("تم التعديل!");
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  }

  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand || !selectedFile) return;
    setIsSubmitting(true);
    const landId = selectedLand.land_id || selectedLand.id;
    const formPayload = new FormData();
    formPayload.append("file", selectedFile);
    formPayload.append("is_cover", "true");
    formPayload.append("sort_order", "1");
    try {
      const res = await fetch(`/api/lands/${landId}/images`, { method: "POST", body: formPayload });
      if (!res.ok) throw new Error("فشل رفع الصورة");
      setIsUploadOpen(false); setSelectedFile(null); load(); alert("تم رفع الصورة!");
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  }

  // Helpers
  const openEditModal = (land: Land) => {
    setSelectedLand(land);
    setFormData({
      title: land.title || "", description: land.description || "", city: land.city || "",
      price_amount: String(land.price_amount || 0), area_sq_m: String(land.area_sq_m || 0),
      address_line: land.address_line || "", status: land.status || "for_sale"
    });
    setIsEditOpen(true);
  };

  const openUploadModal = (land: Land) => { setSelectedLand(land); setIsUploadOpen(true); }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 selection:bg-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">عقاراتي</h1>
            <p className="text-gray-500 mt-2">إدارة ومتابعة العقارات الخاصة بك بسهولة</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={load} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium">
                تحديث
             </button>
             <button onClick={() => { 
                setFormData({title:"", description:"", city:"", price_amount:"", area_sq_m:"", address_line:"", status:"for_sale"});
                setIsCreateOpen(true); 
              }} 
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition w-full md:w-auto"
             >
               <Plus size={18} />
               إضافة عقار
             </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>جاري تحميل البيانات...</p>
            </div>
        )}
        {err && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">{err}</div>}

        {/* --- CARDS GRID (Modern Style) --- */}
        {!loading && !err && (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.map((x, i) => (
              <article 
                key={x.id ?? x.land_id ?? i} 
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                 {/* Image Area - Aspect Video for cinematic look */}
                 <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {(x.cover_image?.file_url || x.cover_image_url) ? (
                      <img 
                        src={x.cover_image?.file_url || x.cover_image_url} 
                        alt={x.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-xs mt-2">لا توجد صورة</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md 
                            ${x.status === 'sold' ? 'bg-red-100/90 text-red-700' : 'bg-emerald-100/90 text-emerald-700'}`}>
                            {x.status === 'sold' ? 'تم البيع' : 'معروض للبيع'}
                        </span>
                    </div>
                 </div>

                 {/* Content Area */}
                 <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-1">{x.title}</h3>
                        <p className="font-bold text-emerald-600 whitespace-nowrap text-sm">
                            {x.price_amount?.toLocaleString()} <span className="text-[10px] text-gray-400">ر.س</span>
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{x.description || "لا يوجد وصف متاح لهذا العقار..."}</p>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-6 bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500"/> {x.city}</div>
                        <div className="flex items-center gap-1.5"><Ruler size={14} className="text-emerald-500"/> {x.area_sq_m} م²</div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-auto grid grid-cols-4 gap-2 border-t border-gray-100 pt-4">
                        <button onClick={() => router.push(`/lands/${x.land_id || x.id}`)} className="col-span-2 flex items-center justify-center gap-1 bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-xs font-bold transition">
                           التفاصيل <ArrowLeft size={12} />
                        </button>
                        <button onClick={() => openEditModal(x)} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition" title="تعديل">
                           <Edit2 size={14} />
                        </button>
                        <button onClick={() => openUploadModal(x)} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition" title="صور">
                           <ImageIcon size={14} />
                        </button>
                    </div>
                 </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL COMPONENT (Reusable) ================= */}
      {/* تم تحسين تصميم المودال ليكون أكثر بياضاً ونظافة */}
      
      {isCreateOpen && (
        <Modal title="إضافة عقار جديد" onClose={() => setIsCreateOpen(false)}>
           <form onSubmit={handleCreate} className="space-y-5">
              <Input label="عنوان العقار" val={formData.title} set={(v:any)=>setFormData({...formData, title:v})} placeholder="مثال: أرض سكنية في حي الملقا" />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="السعر (ر.س)" type="number" val={formData.price_amount} set={(v:any)=>setFormData({...formData, price_amount:v})} />
                 <Input label="المساحة (م²)" type="number" val={formData.area_sq_m} set={(v:any)=>setFormData({...formData, area_sq_m:v})} />
              </div>
              <Input label="المدينة" val={formData.city} set={(v:any)=>setFormData({...formData, city:v})} />
              <Input label="الوصف" val={formData.description} set={(v:any)=>setFormData({...formData, description:v})} isTextArea />
              <div className="pt-2">
                 <SubmitBtn isSubmitting={isSubmitting} text="حفظ العقار" />
              </div>
           </form>
        </Modal>
      )}

      {isEditOpen && (
        <Modal title="تعديل بيانات العقار" onClose={() => setIsEditOpen(false)}>
           <form onSubmit={handleUpdate} className="space-y-5">
              <Input label="عنوان العقار" val={formData.title} set={(v:any)=>setFormData({...formData, title:v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="السعر" type="number" val={formData.price_amount} set={(v:any)=>setFormData({...formData, price_amount:v})} />
                <Select label="حالة العقار" val={formData.status} set={(v:any)=>setFormData({...formData, status:v})}>
                    <option value="for_sale">✅ معروض للبيع</option>
                    <option value="sold">❌ تم البيع</option>
                    <option value="hidden">🔒 مخفي</option>
                </Select>
              </div>
              <Input label="الوصف" val={formData.description} set={(v:any)=>setFormData({...formData, description:v})} isTextArea />
              <div className="pt-2">
                  <SubmitBtn isSubmitting={isSubmitting} text="حفظ التعديلات" />
              </div>
           </form>
        </Modal>
      )}

      {isUploadOpen && (
        <Modal title="إدارة الصور" onClose={() => setIsUploadOpen(false)}>
           <form onSubmit={handleImageUpload} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-gray-50 hover:bg-white hover:border-emerald-400 transition cursor-pointer group">
                 <div className="mb-3 text-gray-400 group-hover:text-emerald-500 transition">
                    <ImageIcon size={40} className="mx-auto" />
                 </div>
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                   className="hidden"
                   id="file-upload"
                 />
                 <label htmlFor="file-upload" className="cursor-pointer block">
                    <span className="font-bold text-gray-700">اضغط لاختيار صورة</span>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5 ميجابايت</p>
                 </label>
                 {selectedFile && <div className="mt-4 text-emerald-600 text-sm font-bold">تم اختيار: {selectedFile.name}</div>}
              </div>
              <SubmitBtn isSubmitting={isSubmitting} text="رفع الصورة الآن" disabled={!selectedFile} />
           </form>
        </Modal>
      )}
    </main>
  );
}

/* --- COMPONENTS (Styled) --- */

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in duration-200">
         <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition">&times;</button>
         </div>
         <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, val, set, type = "text", isTextArea = false, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {isTextArea ? (
        <textarea required rows={3} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition" />
      ) : (
        <input required type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition" />
      )}
    </div>
  );
}

function Select({ label, val, set, children }: any) {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
        <div className="relative">
            <select value={val} onChange={(e) => set(e.target.value)} 
            className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition">
            {children}
            </select>
            <div className="absolute left-3 top-3.5 pointer-events-none text-gray-400">▼</div>
        </div>
      </div>
    );
  }

function SubmitBtn({ isSubmitting, text, disabled }: any) {
  return (
    <button type="submit" disabled={isSubmitting || disabled} 
      className="w-full rounded-xl bg-emerald-600 py-3.5 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-200/50 flex justify-center items-center gap-2">
      {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : text}
    </button>
  );
}