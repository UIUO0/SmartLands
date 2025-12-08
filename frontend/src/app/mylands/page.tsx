"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// تحديث النوع ليشمل الصورة
type Land = {
  land_id?: number;
  id?: number; // أحياناً يأتي باسم id أو land_id
  title?: string;
  city?: string;
  price_amount?: number;
  area_sq_m?: number;
  description?: string;
  status?: string; // sold, for_sale, etc.
  address_line?: string;
  cover_image_url?: string; // رابط الصورة
};

export default function MyLandsPage() {
  const router = useRouter();
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- States for Modals ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [selectedLand, setSelectedLand] = useState<Land | null>(null); // الأرض المختارة للتعديل أو الرفع
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form Data ---
  // نستخدم نفس الهيكل للإضافة والتعديل
  const [formData, setFormData] = useState({
    title: "", description: "", city: "", price_amount: "", area_sq_m: "", address_line: "", status: "for_sale"
  });
  
  // لرفع الصور
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. Fetch Data
  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/lands/mine", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(Array.isArray(j) ? j : j?.items ?? []);
    } catch (e: any) { setErr(e.message); } 
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // 2. Handle Create (إضافة جديدة)
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
          region: "Riyadh", country: "Saudi Arabia", latitude: 0, longitude: 0 // Default
        }),
      });
      if (!res.ok) throw new Error("فشل إضافة الأرض");
      setIsCreateOpen(false);
      load();
      alert("تمت الإضافة بنجاح!");
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // 3. Handle Update (تعديل)
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand) return;
    setIsSubmitting(true);
    
    // نحدد الـ ID الصحيح
    const landId = selectedLand.land_id || selectedLand.id;

    try {
      const res = await fetch(`/api/lands/${landId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price_amount: Number(formData.price_amount),
          status: formData.status, // تحديث الحالة
        }),
      });

      if (!res.ok) throw new Error("فشل التعديل");
      
      setIsEditOpen(false);
      setSelectedLand(null);
      load(); // تحديث القائمة
      alert("تم تعديل بيانات الأرض!");
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // 4. Handle Image Upload (رفع صورة)
  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand || !selectedFile) return;
    setIsSubmitting(true);

    const landId = selectedLand.land_id || selectedLand.id;
    const formPayload = new FormData();
    formPayload.append("file", selectedFile);
    formPayload.append("is_cover", "true"); // جعلها صورة الغلاف تلقائياً
    formPayload.append("sort_order", "1");

    try {
      const res = await fetch(`/api/lands/${landId}/images`, {
        method: "POST",
        body: formPayload, // إرسال كـ Binary
      });

      if (!res.ok) throw new Error("فشل رفع الصورة");
      
      setIsUploadOpen(false);
      setSelectedFile(null);
      load(); // لإظهار الصورة الجديدة
      alert("تم رفع الصورة بنجاح!");
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // دالة مساعدة لفتح مودال التعديل وتعبئة البيانات
  const openEditModal = (land: Land) => {
    setSelectedLand(land);
    setFormData({
      title: land.title || "",
      description: land.description || "",
      city: land.city || "",
      price_amount: String(land.price_amount || 0),
      area_sq_m: String(land.area_sq_m || 0),
      address_line: land.address_line || "",
      status: land.status || "for_sale"
    });
    setIsEditOpen(true);
  };

  const openUploadModal = (land: Land) => {
    setSelectedLand(land);
    setIsUploadOpen(true);
  }

  return (
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans relative pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <header className="rounded-3xl bg-[#D2DCB6] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#A1BC98]/50">
          <div>
            <h1 className="text-3xl font-bold text-black">My Lands</h1>
            <p className="text-[#3a4430] mt-1">إدارة العقارات الخاصة بك</p>
          </div>
          <div className="flex gap-3">
             <button onClick={load} className="px-4 py-2 bg-[#A1BC98] rounded-xl hover:bg-[#8ea885]">تحديث</button>
             <button onClick={() => { 
                setFormData({title:"", description:"", city:"", price_amount:"", area_sq_m:"", address_line:"", status:"for_sale"});
                setIsCreateOpen(true); 
              }} 
              className="px-6 py-3 bg-black text-white rounded-xl font-bold shadow-md hover:bg-[#333] transition"
             >
               + إضافة أرض
             </button>
          </div>
        </header>

        {/* Loading / Error */}
        {loading && <div className="text-center py-10">جارِ التحميل...</div>}
        {err && <div className="text-red-600 text-center bg-red-100 p-4 rounded-xl">{err}</div>}

        {/* Grid Cards */}
        {!loading && !err && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((x, i) => (
              <article key={x.id ?? x.land_id ?? i} className="rounded-3xl bg-[#D2DCB6] shadow-sm border border-[#A1BC98]/30 overflow-hidden flex flex-col">
                 
                 {/* صورة الأرض */}
                 <div className="h-48 w-full bg-[#c1cdae] relative">
                    {x.cover_image_url ? (
                      <img src={x.cover_image_url} alt={x.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/30 text-4xl">📷</div>
                    )}
                    {/* بادج الحالة */}
                    <span className="absolute top-3 right-3 bg-white/80 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {x.status === "sold" ? "❌ مباع" : "✅ للبيع"}
                    </span>
                 </div>

                 <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl mb-1">{x.title}</h3>
                    <p className="text-sm text-[#3a4430] mb-4">{x.city} • {x.price_amount?.toLocaleString()} ر.س</p>
                    
                    <div className="mt-auto flex gap-2 pt-4 border-t border-black/5">
                      {/* زر التعديل */}
                      <button 
                        onClick={() => openEditModal(x)}
                        className="flex-1 bg-white/60 hover:bg-white py-2 rounded-lg text-sm font-bold transition"
                      >
                        ✏️ تعديل
                      </button>
                      
                      {/* زر الصور */}
                      <button 
                         onClick={() => openUploadModal(x)}
                         className="flex-1 bg-black/10 hover:bg-black/20 py-2 rounded-lg text-sm font-bold transition"
                      >
                        🖼️ صور
                      </button>

                      {/* زر التفاصيل (للمستقبل) */}
                      <button 
                         onClick={() => router.push(`/lands/${x.land_id || x.id}`)}
                         className="px-3 bg-[#A1BC98] hover:bg-[#8ea885] rounded-lg"
                      >
                        ➝
                      </button>
                    </div>
                 </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE (إضافة) ================= */}
      {isCreateOpen && (
        <Modal title="إضافة عقار جديد" onClose={() => setIsCreateOpen(false)}>
           <form onSubmit={handleCreate} className="space-y-4">
              <Input label="العنوان" val={formData.title} set={(v)=>setFormData({...formData, title:v})} />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="السعر" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} />
                 <Input label="المساحة" type="number" val={formData.area_sq_m} set={(v)=>setFormData({...formData, area_sq_m:v})} />
              </div>
              <Input label="المدينة" val={formData.city} set={(v)=>setFormData({...formData, city:v})} />
              <Input label="الوصف" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea />
              <SubmitBtn isSubmitting={isSubmitting} text="حفظ الأرض" />
           </form>
        </Modal>
      )}

      {/* ================= MODAL: EDIT (تعديل) ================= */}
      {isEditOpen && (
        <Modal title="تعديل العقار" onClose={() => setIsEditOpen(false)}>
           <form onSubmit={handleUpdate} className="space-y-4">
              <Input label="العنوان" val={formData.title} set={(v)=>setFormData({...formData, title:v})} />
              <Input label="السعر" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} />
              <Input label="الوصف" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea />
              
              {/* قائمة الحالة */}
              <div>
                <label className="block text-sm font-bold mb-1">حالة العقار</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 outline-none bg-white"
                >
                  <option value="for_sale">✅ معروض للبيع</option>
                  <option value="sold">❌ تم البيع</option>
                  <option value="hidden">🔒 مخفي</option>
                </select>
              </div>

              <SubmitBtn isSubmitting={isSubmitting} text="حفظ التعديلات" />
           </form>
        </Modal>
      )}

      {/* ================= MODAL: UPLOAD (رفع صور) ================= */}
      {isUploadOpen && (
        <Modal title="إضافة صورة للعقار" onClose={() => setIsUploadOpen(false)}>
           <form onSubmit={handleImageUpload} className="space-y-6">
              <div className="border-2 border-dashed border-[#A1BC98] rounded-2xl p-8 text-center bg-[#F9FAF4]">
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                   className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D2DCB6] file:text-black hover:file:bg-[#c1cdae]"
                 />
                 <p className="text-xs text-gray-500 mt-2">اختر صورة لتكون غلافاً للأرض</p>
              </div>
              <SubmitBtn isSubmitting={isSubmitting} text="رفع الصورة" disabled={!selectedFile} />
           </form>
        </Modal>
      )}

    </main>
  );
}

// --- 1. تعريف أنواع الـ Modal ---
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#F1F3E0] rounded-3xl shadow-2xl overflow-hidden border border-[#A1BC98]">
         <div className="bg-[#D2DCB6] p-5 border-b border-[#A1BC98] flex justify-between items-center">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-2xl font-bold opacity-50 hover:opacity-100">&times;</button>
         </div>
         <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
// --- 2. تعريف أنواع الـ Input (هذا يحل مشكلة v) ---
interface InputProps {
  label: string;
  val: string | number;         // القيمة قد تكون نصاً أو رقماً
  set: (value: string) => void; // ✅ نحدد أن دالة التغيير تستقبل نصاً دائماً
  type?: string;
  isTextArea?: boolean;
}

function Input({ label, val, set, type = "text", isTextArea = false }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      {isTextArea ? (
        <textarea 
          required 
          rows={3} 
          value={val} 
          onChange={(e) => set(e.target.value)} 
          className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 outline-none focus:border-[#A1BC98]" 
        />
      ) : (
        <input 
          required 
          type={type} 
          value={val} 
          onChange={(e) => set(e.target.value)} 
          className="w-full rounded-xl border-2 border-[#D2DCB6] px-4 py-2 outline-none focus:border-[#A1BC98]" 
        />
      )}
    </div>
  );
}
// --- 3. تعريف أنواع زر الإرسال ---
interface SubmitBtnProps {
  isSubmitting: boolean;
  text: string;
  disabled?: boolean;
}

function SubmitBtn({ isSubmitting, text, disabled }: SubmitBtnProps) {
  return (
    <button 
      type="submit" 
      disabled={isSubmitting || disabled} 
      className="w-full rounded-xl bg-black py-3 text-white font-bold hover:bg-[#333] disabled:opacity-50 transition"
    >
      {isSubmitting ? "جارِ المعالجة..." : text}
    </button>
  );
}