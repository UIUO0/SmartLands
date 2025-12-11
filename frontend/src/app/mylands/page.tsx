"use client";

import { Sidebar } from "@/components/sidebar"; // تأكد من حالة الحرف S (Sidebar)
import { Header } from "@/components/header";
import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Ruler, X, Loader2, Save, Image as ImageIcon, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAbsoluteImageUrl, handleLogout } from "@/lib/utils";
import { LandImage } from "@/components/LandImage";

export default function MyLandsPage() {
    const [lands, setLands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedLandId, setSelectedLandId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

    const [editingLand, setEditingLand] = useState<any>(null);

    const router = useRouter();

    useEffect(() => {
        fetchMyLands();
    }, []);

    // Wrap in useCallback to fix dependency warning
    const fetchMyLands = useCallback(async () => { // eslint-disable-next-line react-hooks/exhaustive-deps
        try {
            const res = await fetch("/api/lands/mine");

            if (res.status === 401) {
                handleLogout(router);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                console.log("📦 Lands Data Received:", data);

                if (Array.isArray(data)) {
                    // Update: Fetch images for each land if missing, similar to PropertyGrid
                    const rawList = data;
                    const landsWithImages = await Promise.all(rawList.map(async (land: any) => {
                        // Check for image in various fields
                        if (land.image || land.image_url || land.cover_image_url || land.picture_url || (land.cover_image && land.cover_image.file_url)) return land;

                        // If no image, try to fetch from /api/lands/{id}/images
                        try {
                            const landId = land.land_id || land.id;
                            if (!landId) return land;

                            const imgRes = await fetch(`/api/lands/${landId}/images`);
                            if (imgRes.ok) {
                                const images = await imgRes.json();
                                const cover = images.find((img: any) => img.is_cover) || images[0];
                                if (cover) {
                                    return { ...land, image: cover.file_url };
                                }
                            }
                        } catch (err) {
                            console.warn("Failed to fetch image for land", land.land_id);
                        }
                        return land;
                    }));
                    setLands(landsWithImages);
                } else if (data && Array.isArray(data.items)) {
                    setLands(data.items);
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

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            price_amount: Number(formData.price_amount),
            area_sq_m: Number(formData.area_sq_m),
            country: "SA"
        };

        try {
            let res;
            if (editingLand) {
                // Update existing
                res = await fetch(`/api/lands/${editingLand.land_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create new
                res = await fetch("/api/lands", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert(editingLand ? "✅ تم تحديث العقار بنجاح!" : "✅ تمت إضافة الأرض بنجاح!");
                setIsModalOpen(false);
                setEditingLand(null);
                setFormData({ title: "", description: "", price_amount: "", area_sq_m: "", city: "Riyadh", region: "", address_line: "", latitude: 24.7136, longitude: 46.6753 });
                fetchMyLands();
            } else {
                const err = await res.json();
                alert("❌ فشل العملية: " + (err.detail || "تأكد من البيانات"));
            }
        } catch {
            alert("خطأ في الاتصال");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(landId: string) {
        if (!confirm("⚠️ هل أنت متأكد من حذف هذه الأرض؟ لا يمكن التراجع عن هذا الإجراء.")) return;

        try {
            const res = await fetch(`/api/lands/${landId}`, { method: "DELETE" });
            if (res.ok) {
                alert("تم حذف العقار بنجاح");
                fetchMyLands();
            } else {
                alert("فشلت عملية الحذف");
            }
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء الحذف");
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedLandId || !selectedImage) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedImage);

        try {
            const res = await fetch(`/api/lands/${selectedLandId}/images`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                alert("✅ تم رفع المحتوى بنجاح!");
                setIsImageModalOpen(false);
                setSelectedImage(null);
                fetchMyLands();
            } else {
                const err = await res.json();
                alert("❌ فشل الرفع: " + (err.detail || "خطأ غير معروف"));
            }
        } catch {
            alert("خطأ في الاتصال");
        } finally {
            setIsUploading(false);
        }
    }

    const openCreateModal = () => {
        setEditingLand(null);
        setFormData({ title: "", description: "", price_amount: "", area_sq_m: "", city: "Riyadh", region: "", address_line: "", latitude: 24.7136, longitude: 46.6753 });
        setIsModalOpen(true);
    };

    const openEditModal = (land: any) => {
        setEditingLand(land);
        setFormData({
            title: land.title || "",
            description: land.description || "",
            price_amount: land.price_amount || "",
            area_sq_m: land.area_sq_m || "",
            city: land.city || "Riyadh",
            region: land.region || "",
            address_line: land.address_line || "",
            latitude: land.latitude || 24.7136,
            longitude: land.longitude || 46.6753
        });
        setIsModalOpen(true);
    };

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
                            onClick={openCreateModal}
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
                            <button onClick={openCreateModal} className="text-[#556b4d] font-bold underline">إضافة أرض الآن</button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {lands.map((land) => {
                                // Enhanced image resolution logic
                                const rawImage = land.image || land.image_url || land.cover_image_url || land.picture_url || (land.cover_image && land.cover_image.file_url) || (land.images && land.images.length > 0 ? land.images[0].url : null);
                                const imageSrc = getAbsoluteImageUrl(rawImage);

                                return (
                                    <div key={land.land_id} className="bg-white rounded-3xl p-5 shadow-sm border border-[#A1BC98]/30 group hover:border-[#A1BC98] transition flex flex-col">

                                        {/* === قسم الصورة المحسن === */}
                                        <div className="h-48 w-full bg-gray-100 rounded-2xl mb-4 overflow-hidden relative border border-gray-100">
                                            <LandImage land={land} showStatus={true} />
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

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 border-t border-gray-100 pt-4 mt-2">
                                            <span className="font-bold text-lg text-black flex-1">{Intl.NumberFormat('en-US').format(land.price_amount)} ر.س</span>

                                            <Link
                                                href={`/mylands/edit/${land.land_id}`}
                                                className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                title="تعديل"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </Link>

                                            <button
                                                onClick={() => handleDelete(land.land_id)}
                                                className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                title="حذف"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>

                                            <Link href={`/mylands/${land.land_id}`} className="text-sm bg-black text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition shadow-md">
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
                                <h2 className="text-2xl font-bold">{editingLand ? "تعديل العقار" : "إضافة عقار جديد"}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 hover:text-red-500" /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
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
                                    {editingLand ? "حفظ التعديلات" : "نشر الإعلان"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* Image Upload Modal */}
                {isImageModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-[#F1F3E0] w-full max-w-md rounded-3xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 border-b border-[#A1BC98]/30 pb-4">
                                <h2 className="text-2xl font-bold">رفع صور للعقار</h2>
                                <button onClick={() => setIsImageModalOpen(false)}><X className="h-6 w-6 hover:text-red-500" /></button>
                            </div>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="border-2 border-dashed border-[#A1BC98] rounded-xl p-8 text-center cursor-pointer hover:bg-[#EDEFE5] transition relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)}
                                    />
                                    <ImageIcon className="h-12 w-12 mx-auto text-[#556b4d] mb-2" />
                                    <p className="text-gray-600 font-medium">
                                        {selectedImage ? selectedImage.name : "اضغط لاختيار صورة"}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUploading || !selectedImage}
                                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#333] transition flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
                                    تأكيد الرفع
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}