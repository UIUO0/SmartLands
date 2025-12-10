"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header"; // نستخدم الهيدر الموحد
import { Plus, RefreshCw, Pencil, Image as ImageIcon, ExternalLink } from "lucide-react";

// تعريفات الأنواع (كما هي في كودك السابق)
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

  // States for Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
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
    } catch (e: any) { setErr(e.message); } 
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // 2. Handle Create
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
      if (!res.ok) throw new Error("Failed to add land");
      setIsCreateOpen(false); load();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  }

  // 3. Handle Update
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

  // 4. Handle Image Upload
  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand || !selectedFile) return;
    setIsSubmitting(true);
    const landId = selectedLand.land_id || selectedLand.id;
    const formPayload = new FormData();
    formPayload.append("file", selectedFile);
    formPayload.append("is_cover", "true"); 
    try {
      const res = await fetch(`/api/lands/${landId}/images`, { method: "POST", body: formPayload });
      if (!res.ok) throw new Error("Failed to upload image");
      setIsUploadOpen(false); setSelectedFile(null); load();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
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

  const openUploadModal = (land: Land) => {
    setSelectedLand(land);
    setIsUploadOpen(true);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Custom Header for My Lands */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl shadow-sm border border-border">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Properties</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your real estate assets</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={load} className="p-3 bg-secondary rounded-xl hover:bg-primary/20 transition-colors" title="Refresh">
                        <RefreshCw className="h-5 w-5 text-foreground" />
                    </button>
                    <button 
                        onClick={() => { 
                            setFormData({title:"", description:"", city:"", price_amount:"", area_sq_m:"", address_line:"", status:"for_sale"});
                            setIsCreateOpen(true); 
                        }} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-black/80 transition shadow-md"
                    >
                        <Plus className="h-5 w-5" /> Add New Land
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading && <div className="text-center py-20"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary"/></div>}
            {err && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-center border border-red-200">{err}</div>}

            {!loading && !err && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((x, i) => (
                  <div key={x.id ?? x.land_id ?? i} className="group bg-card rounded-3xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-all flex flex-col gap-4">
                     
                     <div className="flex gap-4">
                        {/* Image Thumbnail */}
                        <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-secondary border border-black/5 relative">
                            <img 
                                src={x.cover_image?.file_url || x.cover_image_url || "/placeholder.svg"} 
                                alt={x.title} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-bold text-lg leading-tight truncate text-foreground">{x.title}</h3>
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                               <p>📍 {x.city}</p>
                               <p>💰 <span className="font-bold text-foreground">{x.price_amount?.toLocaleString()}</span> SAR</p>
                               <p>📏 {x.area_sq_m} m²</p>
                            </div>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex gap-2 mt-auto pt-3 border-t border-black/5">
                          <button onClick={() => openEditModal(x)} className="flex-1 flex items-center justify-center gap-1.5 bg-white/50 hover:bg-white py-2 rounded-xl text-xs font-bold transition text-foreground">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => openUploadModal(x)} className="flex-1 flex items-center justify-center gap-1.5 bg-white/50 hover:bg-white py-2 rounded-xl text-xs font-bold transition text-foreground">
                            <ImageIcon className="h-3 w-3" /> Photo
                          </button>
                          {/* يمكنك تفعيل هذا الزر لاحقاً للانتقال للتفاصيل */}
                          <button className="px-3 bg-primary hover:bg-primary/80 rounded-xl text-foreground transition flex items-center justify-center">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MODALS (Reused your logic) --- */}
        {isCreateOpen && (
            <Modal title="Add New Property" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
                <Input label="Title" val={formData.title} set={(v)=>setFormData({...formData, title:v})} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Price (SAR)" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} />
                    <Input label="Area (m²)" type="number" val={formData.area_sq_m} set={(v)=>setFormData({...formData, area_sq_m:v})} />
                </div>
                <Input label="City" val={formData.city} set={(v)=>setFormData({...formData, city:v})} />
                <Input label="Description" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea />
                <SubmitBtn isSubmitting={isSubmitting} text="Save Property" />
            </form>
            </Modal>
        )}

        {isEditOpen && (
            <Modal title="Edit Property" onClose={() => setIsEditOpen(false)}>
            <form onSubmit={handleUpdate} className="space-y-4">
                <Input label="Title" val={formData.title} set={(v)=>setFormData({...formData, title:v})} />
                <Input label="Price" type="number" val={formData.price_amount} set={(v)=>setFormData({...formData, price_amount:v})} />
                <Input label="Description" val={formData.description} set={(v)=>setFormData({...formData, description:v})} isTextArea />
                <div>
                    <label className="block text-sm font-bold mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl border border-primary px-4 py-2 outline-none bg-white">
                    <option value="for_sale">✅ For Sale</option>
                    <option value="sold">❌ Sold</option>
                    <option value="hidden">🔒 Hidden</option>
                    </select>
                </div>
                <SubmitBtn isSubmitting={isSubmitting} text="Update Changes" />
            </form>
            </Modal>
        )}

        {isUploadOpen && (
            <Modal title="Upload Cover Image" onClose={() => setIsUploadOpen(false)}>
            <form onSubmit={handleImageUpload} className="space-y-6">
                <div className="border-2 border-dashed border-primary/50 rounded-2xl p-8 text-center bg-secondary/20">
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80" />
                </div>
                <SubmitBtn isSubmitting={isSubmitting} text="Upload Now" disabled={!selectedFile} />
            </form>
            </Modal>
        )}

      </main>
    </div>
  );
}

// --- Components (Modals & Inputs) ---
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-background rounded-3xl shadow-2xl overflow-hidden border border-border">
         <div className="bg-card p-5 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-2xl font-bold opacity-50 hover:opacity-100">&times;</button>
         </div>
         <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, val, set, type = "text", isTextArea = false }: { label: string, val: string | number, set: (v: string) => void, type?: string, isTextArea?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1 text-foreground/80">{label}</label>
      {isTextArea ? (
        <textarea required rows={3} value={val} onChange={(e) => set(e.target.value)} className="w-full rounded-xl border border-primary/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
      ) : (
        <input required type={type} value={val} onChange={(e) => set(e.target.value)} className="w-full rounded-xl border border-primary/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
      )}
    </div>
  );
}

function SubmitBtn({ isSubmitting, text, disabled }: { isSubmitting: boolean, text: string, disabled?: boolean }) {
  return (
    <button type="submit" disabled={isSubmitting || disabled} className="w-full rounded-xl bg-foreground py-3 text-background font-bold hover:opacity-90 disabled:opacity-50 transition">
      {isSubmitting ? "Processing..." : text}
    </button>
  );
}