"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { LandImage } from "@/components/LandImage";
import { Save, ArrowRight, Loader2, Image as ImageIcon, X, Edit } from "lucide-react";
import Link from "next/link";

export default function EditLandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Land Data
    const [land, setLand] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price_amount: "",
        area_sq_m: "",
        city: "",
        region: "",
        address_line: ""
    });

    // Image Upload
    const [existingImages, setExistingImages] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);


    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch(`/api/lands/${id}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Land not found");
                const data = await res.json();
                setLand(data);
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    price_amount: data.price_amount || "",
                    area_sq_m: data.area_sq_m || "",
                    city: data.city || "",
                    region: data.region || "",
                    address_line: data.address_line || ""
                });

                // Fetch existing images
                const imgRes = await fetch(`/api/lands/${id}/images`);
                if (imgRes.ok) {
                    const images = await imgRes.json();
                    setExistingImages(images);
                }
            } catch {
                // Handle error
            } finally {
                setLoading(false);
            }
        }
        if (id) loadData();
    }, [id]);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            price_amount: Number(formData.price_amount),
            area_sq_m: Number(formData.area_sq_m),
            city: formData.city,
            region: formData.region,
            // address_line: formData.address_line, // Optional, uncomment if needed
        };

        try {
            const res = await fetch(`/api/lands/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.status === 401) {
                alert(" انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.");
                router.push("/login");
                return;
            }

            if (res.ok) {
                alert("✅ تم تحديث العقار بنجاح!");
                router.push(`/mylands/${id}`);
            } else {
                const err = await res.json();
                alert("❌ فشل التحديث: " + (err.detail || "خطأ غير معروف"));
            }
        } catch (e) {
            console.error(e);
            alert("خطأ في الاتصال");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !selectedImage) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedImage);

        try {
            const res = await fetch(`/api/lands/${id}/images`, {
                method: "POST",
                body: formData
            });

            if (res.status === 401) {
                alert(" انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.");
                router.push("/login");
                return;
            }

            if (res.ok) {
                alert("✅ تم رفع الصورة بنجاح!");
                setSelectedImage(null);
                // Refresh data to show new image
                const landRes = await fetch(`/api/lands/${id}`);
                const updatedLand = await landRes.json();
                setLand(updatedLand);
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

    async function handleDeleteImage(imageId: number) {
        if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

        setDeletingImageId(imageId);
        try {
            const res = await fetch(`/api/lands/${id}/images/${imageId}`, {
                method: "DELETE"
            });

            if (res.status === 401) {
                alert(" انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.");
                router.push("/login");
                return;
            }

            if (res.ok) {
                alert("✅ تم حذف الصورة بنجاح!");
                // Refresh images
                const imgRes = await fetch(`/api/lands/${id}/images`);
                if (imgRes.ok) {
                    const images = await imgRes.json();
                    setExistingImages(images);
                }
            } else {
                alert("❌ فشل حذف الصورة");
            }
        } catch (e) {
            console.error(e);
            alert("خطأ في الاتصال");
        } finally {
            setDeletingImageId(null);
        }
    }

    if (loading) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center text-[#556b4d] animate-pulse">جارِ التحميل...</div>;
    if (!land) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center">لم يتم العثور على الأرض</div>;

    return (
        <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans p-6 relative">
            <div className="max-w-4xl mx-auto space-y-8">

                <Link href={`/mylands/${id}`} className="inline-flex items-center text-[#556b4d] font-bold hover:underline">
                    <ArrowRight className="h-5 w-5 ml-2" /> إلغاء وعودة للتفاصيل
                </Link>

                {/* Edit Form */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#A1BC98]/50">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Edit className="h-8 w-8 text-[#556b4d]" /> تعديل بيانات العقار
                    </h1>

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">عنوان الإعلان</label>
                                <input required type="text" className="w-full p-4 rounded-xl border border-[#A1BC98] bg-[#F9FAFB] focus:ring-2 focus:ring-[#556b4d]"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">السعر (ر.س)</label>
                                <input required type="number" className="w-full p-4 rounded-xl border border-[#A1BC98] bg-[#F9FAFB] focus:ring-2 focus:ring-[#556b4d]"
                                    value={formData.price_amount} onChange={e => setFormData({ ...formData, price_amount: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">المساحة (م²)</label>
                                <input required type="number" className="w-full p-4 rounded-xl border border-[#A1BC98] bg-[#F9FAFB] focus:ring-2 focus:ring-[#556b4d]"
                                    value={formData.area_sq_m} onChange={e => setFormData({ ...formData, area_sq_m: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">المدينة</label>
                                <input required type="text" className="w-full p-4 rounded-xl border border-[#A1BC98] bg-[#F9FAFB] focus:ring-2 focus:ring-[#556b4d]"
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">التفاصيل والوصف</label>
                            <textarea required rows={5} className="w-full p-4 rounded-xl border border-[#A1BC98] bg-[#F9FAFB] focus:ring-2 focus:ring-[#556b4d]"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>



                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#333] transition flex justify-center items-center gap-2 mt-4"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
                            حفظ التعديلات
                        </button>
                    </form>
                </section>

                {/* Image Management Section */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#A1BC98]/50">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <ImageIcon className="h-7 w-7 text-[#556b4d]" /> صور العقار
                    </h2>

                    <div className="h-64 w-full rounded-2xl overflow-hidden mb-6 bg-gray-100 border border-gray-200">
                        <LandImage land={land} />
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
                            <div className="pointer-events-none">
                                <ImageIcon className="h-10 w-10 mx-auto text-[#556b4d] mb-2" />
                                <p className="text-gray-600 font-medium">
                                    {selectedImage ? selectedImage.name : "اضغط لرفع صورة جديدة (تستبدل الحالية)"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isUploading || !selectedImage}
                            className="w-full bg-[#A1BC98] text-black font-bold py-3 rounded-xl hover:bg-[#8ea885] transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : "رفع الصورة"}
                        </button>
                    </form>

                    {/* Existing Images Gallery */}
                    {existingImages.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-bold mb-4">الصور الموجودة ({existingImages.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {existingImages.map((img: any) => (
                                    <div key={img.image_id} className="relative group">
                                        <img
                                            src={img.file_url.startsWith('http') ? img.file_url : `https://smartlands-production.up.railway.app${img.file_url}`}
                                            alt="Land"
                                            className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                        />
                                        <button
                                            onClick={() => handleDeleteImage(img.image_id)}
                                            disabled={deletingImageId === img.image_id}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition shadow-lg opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        >
                                            {deletingImageId === img.image_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </button>
                                        {img.is_cover && (
                                            <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                                الصورة الرئيسية
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </main >
    );
}
