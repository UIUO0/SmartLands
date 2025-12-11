"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAbsoluteImageUrl } from "@/lib/utils";
import { Trash, Edit, X, Save, Loader2 } from "lucide-react";

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
  // Extra fields for edit
  country?: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
};

export default function LandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [land, setLand] = useState<LandDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState("");

  // Edit/Delete State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<LandDetail>>({});

  // 1. جلب تفاصيل الأرض و المستخدم الحالي
  useEffect(() => {
    async function loadData() {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

        // Fetch Land
        const res = await fetch(`${BASE}/lands/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status === 404 ? "Land not found" : "Error");
        const landData = await res.json();
        setLand(landData);

        // Fetch Current User
        const userRes = await fetch("/api/users/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
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

  // 3. دالة حذف الأرض
  async function handleDelete() {
    if (!confirm("⚠️ هل أنت متأكد من حذف هذه الأرض؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/lands/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("تم حذف العقار بنجاح");
        router.push("/mylands");
      } else {
        alert("فشلت عملية الحذف");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  }

  // 4. دالة تحديث الأرض
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/lands/${id}`, {
        method: "PATCH", // Using PATCH as per API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        const updatedLand = await res.json();
        setLand(updatedLand);
        setIsEditModalOpen(false);
        alert("✅ تم تحديث بيانات العقار بنجاح!");
      } else {
        const err = await res.json();
        alert("❌ فشل التحديث: " + (err.detail || "خطأ غير معروف"));
      }
    } catch (e) {
      console.error(e);
      alert("خطأ في الشبكة");
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle Edit Click
  const openEditModal = () => {
    if (!land) return;
    setEditFormData({
      title: land.title,
      description: land.description,
      price_amount: land.price_amount,
      area_sq_m: land.area_sq_m,
      city: land.city,
      region: land.region,
      // country: land.country, // If available
    });
    setIsEditModalOpen(true);
  }

  if (loading) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center text-[#556b4d] animate-pulse">جارِ التحميل...</div>;

  if (!land) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center">لم يتم العثور على الأرض</div>;

  const isOwner = currentUser && land.owner_id && currentUser.id && String(land.owner_id) === String(currentUser.id);

  // Enhanced image resolution
  const rawImage = (land as any).image || (land as any).image_url || (land as any).cover_image_url || (land as any).picture_url || ((land as any).images && (land as any).images.length > 0 ? (land as any).images[0].url : null);
  const imageSrc = getAbsoluteImageUrl(rawImage);

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
          <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-6 bg-gray-200 border border-[#A1BC98]/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {imageSrc && imageSrc !== "/placeholder.svg" ? (
              <img
                src={imageSrc}
                alt={land.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span>لا توجد صورة متاحة</span>
              </div>
            )}
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

            {/* رسائل التنبيه للمشتري */}
            {msg && !isOwner && (
              <div className={`p-4 rounded-xl mb-4 text-center font-bold ${requestStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {msg}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {isOwner ? (
                // إجراءات المالك
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={openEditModal}
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                  >
                    <Edit className="h-5 w-5" /> تعديل العقار
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <Trash className="h-5 w-5" />}
                    حذف
                  </button>
                </div>
              ) : (
                // إجراءات المشتري
                requestStatus === 'success' ? (
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
                )
              )}
            </div>
          </div>
        </article>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#F1F3E0] w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-[#A1BC98]/30 pb-4">
              <h2 className="text-2xl font-bold">تعديل العقار</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X className="h-6 w-6 hover:text-red-500" /></button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">عنوان الإعلان</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                    value={editFormData.title || ""} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">السعر (ر.س)</label>
                  <input type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                    value={editFormData.price_amount || ""} onChange={e => setEditFormData({ ...editFormData, price_amount: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">المساحة (م²)</label>
                  <input type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                    value={editFormData.area_sq_m || ""} onChange={e => setEditFormData({ ...editFormData, area_sq_m: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">المدينة</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                    value={editFormData.city || ""} onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">التفاصيل والوصف</label>
                <textarea rows={4} className="w-full p-3 rounded-xl border border-[#A1BC98]"
                  value={editFormData.description || ""} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#333] transition flex justify-center items-center gap-2 mt-4"
              >
                {isUpdating ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}