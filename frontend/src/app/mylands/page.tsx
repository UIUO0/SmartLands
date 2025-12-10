"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Plus, RefreshCw, Pencil, Image as ImageIcon, MapPin, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

// تعريف نوع البيانات حسب الباك-إند
type Land = {
  land_id?: number;
  id?: number;
  title: string;
  city: string;
  price_amount: number;
  area_sq_m: number;
  description?: string;
  status?: string; // available, reserved, sold
  cover_image_url?: string;
  image_url?: string; // لدعم التسميات المختلفة
};

export default function MyLandsPage() {
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // States للمودلز (النوافذ المنبثقة)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات الفورم
  const [formData, setFormData] = useState({
    title: "", description: "", city: "", price_amount: "", area_sq_m: "", address_line: "", status: "available"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. دالة جلب البيانات (Fetch)
  async function load() {
    setLoading(true); setErr(null);
    try {
      // نطلب أراضي المستخدم الخاصة
      const r = await fetch("/api/lands/mine", { cache: "no-store" });
      if (!r.ok) throw new Error("Could not load your lands");
      
      const responseData = await r.json();
      // التعامل مع احتمالات الرد (مصفوفة مباشرة أو داخل items)
      const items = Array.isArray(responseData) ? responseData : responseData.items || responseData.data || [];

      // جلب الصور لكل أرض
      const landsWithImages = await Promise.all(items.map(async (land: Land) => {
        try {
            const landId = land.land_id || land.id;
            // نطلب الصور عبر البروكسي
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
    } catch (e: any) { 
        console.error(e);
        setErr("Failed to load lands. Make sure you are logged in."); 
    } 
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // 2. دالة إنشاء أرض جديدة
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
          // قيم افتراضية مطلوبة من الباك-إند
          region: "Riyadh", country: "SA", latitude: 24.7, longitude: 46.6 
        }),
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to add land");
      }
      setIsCreateOpen(false); 
      load(); // إعادة تحميل القائمة
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // 3. دالة تعديل الأرض
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
      if (!res.ok) throw new Error("Failed to update");
      setIsEditOpen(false); setSelectedLand(null); load();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // 4. دالة رفع الصورة
  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand || !selectedFile) return;
    
    // ملاحظة: نحتاج لإنشاء Route Handler للرفع لاحقاً إذا لم يعمل مباشرة
    // لكن سنحاول استخدام الـ FormData القياسي
    setIsSubmitting(true);
    const landId = selectedLand.land_id || selectedLand.id;
    
    // ملاحظة مهمة: رفع الملفات في Next.js يحتاج تعامل خاص في الـ API Route
    // هنا سنفترض وجود endpoint جاهز في /api/lands/[id]/images/upload
    // إذا لم يكن موجوداً سننشئه في الخطوة القادمة
    const formPayload = new FormData();
    formPayload.append("file", selectedFile);

    try {
        // نستخدم رابط مباشر للباك إند مؤقتاً أو ننشئ بروكسي للرفع
        // بما أن الرفع معقد، سأشرح لك كيفية عمل البروكسي له في الخطوة التالية
        alert("Image upload requires a Backend Proxy setup. Check the chat for instructions.");
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // Helpers لفتح المودلز
  const openEditModal = (land: Land) => {
    setSelectedLand(land);
    setFormData({
      title: land.title || "", description: land.description || "", city: land.city || "",
      price_amount: String(land.price_amount || 0), area_sq_m: String(land.area_sq_m || 0),
      address_line: "", status: land.status || "available"
    });
    setIsEditOpen(true);
  };

  const openUploadModal = (land: Land) => {
    setSelectedLand(land);
    setIsUploadOpen(true);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* الهيدر الخاص بالصفحة */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border">
                <div>
                    <h1 className="text-3xl font-bold">My Properties</h1>
                    <p className="opacity-70 mt-1">Manage your real estate portfolio</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={load} className="p-3 bg-white/50 rounded-xl hover:bg-white transition" title="Refresh">
                        <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button 
                        onClick={() => { 
                            setFormData({title:"", description:"", city:"", price_amount:"", area_sq_m:"", address_line:"", status:"available"});
                            setIsCreateOpen(true); 
                        }} 
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                        <Plus className="h-5 w-5" /> Add New Land
                    </button>
                </div>
            </div>

            {/* شبكة عرض الأراضي */}
            {loading && data.length === 0 && <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary"/></div>}
            
            {!loading && data.length === 0 && !err && (
                <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border">
                    <p className="text-xl font-bold opacity-50">No properties found.</p>
                    <p className="text-sm opacity-50">Start by adding your first land!</p>
                </div>
            )}

            {err && <div className="p-4 bg-red-100 text-red-700 rounded-xl text-center border border-red-200">{err}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((land) => (
                  <div key={land.land_id || land.id} className="group bg-card rounded-3xl p-4 border border-border hover:shadow-xl transition-all flex flex-col gap-4">
                     
                     <div className="flex gap-4">
                        {/* صورة مصغرة */}
                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-200 relative border border-black/10">
                            <img 
                                src={land.cover_image_url || land.image_url || "/placeholder.svg"} 
                                alt={land.title} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        
                        {/* المعلومات */}
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg leading-tight truncate">{land.title}</h3>
                                <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                                    <MapPin className="h-3 w-3" /> {land.city}
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="font-bold text-lg">{land.price_amount?.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                                    land.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                    {land.status}
                                </span>
                            </div>
                        </div>
                     </div>

                     {/* أزرار التحكم */}
                     <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-black/5">
                          <button onClick={() => openEditModal(land)} className="flex items-center justify-center gap-2 bg-white/40 hover:bg-white py-2.5 rounded-xl text-xs font-bold transition">
                            <Pencil className="h-3.5 w-3.5" /> Edit Info
                          </button>
                          <button onClick={() => openUploadModal(land)} className="flex items-center justify-center gap-2 bg-white/40 hover:bg-white py-2.5 rounded-xl text-xs font-bold transition">
                            <ImageIcon className="h-3.5 w-3.5" /> Photos
                          </button>
                     </div>
                  </div>
                ))}
            </div>

          </div>
        </div>

        {/* --- MODALS (نوافذ منبثقة) --- */}
        
        {/* 1. Create Modal */}
        {isCreateOpen && (
            <Modal title="Add New Property" onClose={() => setIsCreateOpen(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input label="Property Title" val={formData.title} set={(v)=>setFormData({...formData, title:v})} placeholder="e.g. Luxury Villa in Riyadh" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Price (SAR)" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} placeholder="0" />
                        <Input label="Area (m²)" type="number" val={formData.area_sq_m} set={(v)=>setFormData({...formData, area_sq_m:v})} placeholder="0" />
                    </div>
                    <Input label="City" val={formData.city} set={(v)=>setFormData({...formData, city:v})} placeholder="e.g. Riyadh" />
                    <Input label="Address Details" val={formData.address_line} set={(v)=>setFormData({...formData, address_line:v})} placeholder="Street name, District..." />
                    <Input label="Description" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea placeholder="Describe the property..." />
                    <SubmitBtn isSubmitting={isSubmitting} text="Save Property" />
                </form>
            </Modal>
        )}

        {/* 2. Edit Modal */}
        {isEditOpen && (
            <Modal title="Edit Property" onClose={() => setIsEditOpen(false)}>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <Input label="Title" val={formData.title} set={(v)=>setFormData({...formData, title:v})} />
                    <Input label="Price" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} />
                    <Input label="Description" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea />
                    <div>
                        <label className="block text-sm font-bold mb-1 opacity-80">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl border border-primary/50 px-4 py-2 bg-white outline-none">
                            <option value="available">🟢 Available</option>
                            <option value="reserved">🟡 Reserved</option>
                            <option value="sold">🔴 Sold</option>
                        </select>
                    </div>
                    <SubmitBtn isSubmitting={isSubmitting} text="Update Changes" />
                </form>
            </Modal>
        )}

        {/* 3. Upload Modal */}
        {isUploadOpen && (
            <Modal title="Upload Cover Image" onClose={() => setIsUploadOpen(false)}>
                <form onSubmit={handleImageUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center bg-white/30 hover:bg-white/50 transition">
                        <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80 cursor-pointer" />
                        <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG, WEBP</p>
                    </div>
                    <SubmitBtn isSubmitting={isSubmitting} text="Upload Photo" disabled={!selectedFile} />
                </form>
            </Modal>
        )}

      </main>
    </div>
  );
}

// --- Components (Modals & Inputs reusable) ---
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#F1F3E0] rounded-3xl shadow-2xl overflow-hidden border border-[#A1BC98] animate-in zoom-in-95 duration-200">
         <div className="bg-[#D2DCB6] p-5 border-b border-[#A1BC98] flex justify-between items-center">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 font-bold text-xl">&times;</button>
         </div>
         <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, val, set, type = "text", isTextArea = false, placeholder }: { label: string, val: string | number, set: (v: string) => void, type?: string, isTextArea?: boolean, placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1 opacity-80">{label}</label>
      {isTextArea ? (
        <textarea placeholder={placeholder} required rows={3} value={val} onChange={(e) => set(e.target.value)} className="w-full rounded-xl border border-primary/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
      ) : (
        <input placeholder={placeholder} required type={type} value={val} onChange={(e) => set(e.target.value)} className="w-full rounded-xl border border-primary/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
      )}
    </div>
  );
}

function SubmitBtn({ isSubmitting, text, disabled }: { isSubmitting: boolean, text: string, disabled?: boolean }) {
  return (
    <button type="submit" disabled={isSubmitting || disabled} className="w-full rounded-xl bg-black text-white py-3.5 font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg">
      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto"/> : text}
    </button>
  );
}