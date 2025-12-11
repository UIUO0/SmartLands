"use client";

import { Sidebar } from "@/components/sidebar"; // تأكد من حالة الحرف S (Sidebar)
import { Header } from "@/components/header";
import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Ruler, X, Loader2, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyLandsPage() {
    const [lands, setLands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price_amount: "",
        area_sq_m: "",
        city: "Riyadh",
        region: "",
        address_line: "",
        latitude: 24.7136,
        longitude: 46.6753
    });

    const router = useRouter();

    useEffect(() => {
        fetchMyLands();
    }, []);

    // Wrap in useCallback to fix dependency warning
    const fetchMyLands = useCallback(async () => { // eslint-disable-next-line react-hooks/exhaustive-deps
        try {
            const res = await fetch("/api/lands/mine");

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            if (res.ok) {
                const data = await res.json();
                console.log("📦 Lands Data Received:", data);

                if (Array.isArray(data)) {
                    setLands(data);
                } else if (data && Array.isArray(data.items)) {
                    setLands(data.items);
                } else if (data && Array.isArray(data.lands)) {
                    setLands(data.lands);
                } else {
                    setLands([]);
                }
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            setLands([]);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchMyLands();
    }, [fetchMyLands]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            price_amount: Number(formData.price_amount),
            area_sq_m: Number(formData.area_sq_m),
            country: "SA"
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
                setFormData({ ...formData, title: "", description: "", price_amount: "", area_sq_m: "" });
                fetchMyLands();
            } else {
                const err = await res.json();
                alert("❌ فشل الإضافة: " + (err.detail || "تأكد من البيانات"));
            }
        } catch {
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
                            <MapPin className="h-8 w-8" /> أراضيّ المعروضة
                        </h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-[#333] transition flex items-center gap-2 shadow-lg"
                        >
                            <Plus className="h-5 w-5" /> إضافة أرض جديدة
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-[#556b4d] animate-pulse">جارِ تحميل عقاراتك...</div>
                    ) : lands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-[#D2DCB6] p-6 rounded-full mb-4">
                                <MapPin className="h-10 w-10 text-black/50" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">لا تملك أي أراضي معروضة حالياً</h2>
                            <p className="text-gray-500 mb-6">ابدأ بإضافة أول عقار لك ليتمكن المشترون من العثور عليه.</p>
                            <button onClick={() => setIsModalOpen(true)} className="text-[#556b4d] font-bold underline">إضافة أرض الآن</button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {lands.map((land) => {
                                // منطق تحديد رابط الصورة: يبحث في عدة حقول محتملة
                                const imageSrc = land.cover_image_url || land.picture_url || (land.images && land.images.length > 0 ? land.images[0].url : null);

                                return (
                                    <div key={land.land_id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#A1BC98]/30 group hover:border-[#A1BC98] transition flex flex-col">

                                        {/* === قسم الصورة المحسن === */}
                                        <div className="h-48 w-full bg-gray-100 rounded-2xl mb-4 overflow-hidden relative border border-gray-100">
                                            {imageSrc ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageSrc}
                                                    alt={land.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        // في حال فشل تحميل الصورة، نخفيها ونعرض الرمز البديل
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}

                                            {/* الرمز البديل (يظهر إذا لم يكن هناك رابط، أو إذا فشل التحميل) */}
                                            <div
                                                className="flex flex-col items-center justify-center h-full text-gray-400 w-full absolute top-0 left-0 bg-[#F9FAFB]"
                                                style={{ display: imageSrc ? 'none' : 'flex' }}
                                            >
                                                <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                                <span className="text-xs">لا توجد صورة</span>
                                            </div>

                                            <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-lg shadow-sm z-10 ${land.status === 'available' ? 'bg-white text-green-700' : 'bg-gray-800 text-white'}`}>
                                                {land.status === 'available' ? 'متاح' : land.status}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-xl truncate text-black w-full" title={land.title}>{land.title}</h3>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                                            {land.description || "لا يوجد وصف متاح لهذا العقار."}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm font-medium text-[#556b4d] mb-4 mt-auto">
                                            <span className="flex items-center gap-1 bg-[#F1F3E0] px-2 py-1 rounded-lg"><Ruler className="h-3.5 w-3.5" /> {land.area_sq_m} م²</span>
                                            <span className="flex items-center gap-1 bg-[#F1F3E0] px-2 py-1 rounded-lg"><MapPin className="h-3.5 w-3.5" /> {land.city}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                            <span className="font-bold text-lg text-black">{Intl.NumberFormat('en-US').format(land.price_amount)} ر.س</span>
                                            <Link href={`/lands/${land.land_id}`} className="text-sm bg-black text-white px-5 py-2.5 rounded-xl hover:bg-[#333] transition shadow-md">
                                                التفاصيل
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-[#F1F3E0] w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-[#A1BC98]/30 pb-4">
                                <h2 className="text-2xl font-bold">إضافة عقار جديد</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 hover:text-red-500" /></button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">عنوان الإعلان</label>
                                        <input required type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="مثال: أرض سكنية في حي الملقا" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">السعر (ر.س)</label>
                                        <input required type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                                            value={formData.price_amount} onChange={e => setFormData({ ...formData, price_amount: e.target.value })} placeholder="500000" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">المساحة (م²)</label>
                                        <input required type="number" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                                            value={formData.area_sq_m} onChange={e => setFormData({ ...formData, area_sq_m: e.target.value })} placeholder="450" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">المدينة</label>
                                        <input required type="text" className="w-full p-3 rounded-xl border border-[#A1BC98]"
                                            value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1">التفاصيل والوصف</label>
                                    <textarea required rows={4} className="w-full p-3 rounded-xl border border-[#A1BC98]"
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="اكتب وصفاً مميزاً للأرض..." />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#333] transition flex justify-center items-center gap-2 mt-4"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
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