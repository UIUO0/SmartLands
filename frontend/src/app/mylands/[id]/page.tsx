"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { LandImage } from "@/components/LandImage";
import { Trash, Edit, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function OwnerLandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [land, setLand] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // Fetch Land
                const res = await fetch(`/api/lands/${id}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Land not found");
                const landData = await res.json();
                console.log("🖼️ Owner Details - Land Data:", landData);
                console.log("🖼️ Image fields check:", {
                    image: landData.image,
                    image_url: landData.image_url,
                    cover_image_url: landData.cover_image_url,
                    picture_url: landData.picture_url,
                    cover_image: landData.cover_image,
                    images: landData.images
                });
                setLand(landData);
            } catch {
                // Redirect if not found, or show error
            } finally {
                setLoading(false);
            }
        }
        if (id) loadData();
    }, [id]);

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

    if (loading) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center text-[#556b4d] animate-pulse">جارِ التحميل...</div>;
    if (!land) return <div className="min-h-screen bg-[#F1F3E0] flex items-center justify-center">لم يتم العثور على الأرض</div>;

    return (
        <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans p-6 relative">
            <div className="max-w-4xl mx-auto space-y-6">

                <Link href="/mylands" className="inline-flex items-center text-[#556b4d] font-bold hover:underline mb-4">
                    <ArrowRight className="h-5 w-5 ml-2" /> عودة لقائمة أراضيك
                </Link>

                <article className="bg-[#D2DCB6] rounded-3xl p-8 shadow-sm border border-[#A1BC98]/50">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-black mb-2">{land.title}</h1>
                            <p className="text-[#3a4430] font-medium">📍 {land.city} {land.region && `- ${land.region}`}</p>
                        </div>
                        <div className="bg-[#F1F3E0] px-5 py-3 rounded-2xl shadow-sm text-center min-w-[150px]">
                            <p className="text-xs text-gray-500 font-bold uppercase">السعر المطلوب</p>
                            <p className="text-2xl font-bold text-black">{Intl.NumberFormat("ar-SA").format(land.price_amount)} ر.س</p>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="h-96 w-full rounded-2xl overflow-hidden mb-6 bg-gray-200 border border-[#A1BC98]/30">
                        <LandImage land={land} />
                    </div>

                    {/* Details */}
                    <div className="bg-white/40 p-6 rounded-2xl border border-[#A1BC98]/30 mb-8">
                        <div className="flex gap-4 mb-4 text-sm font-semibold text-[#556b4d]">
                            <span>📐 المساحة: {land.area_sq_m} م²</span>
                            <span>🏷️ الحالة: {land.status === 'available' ? 'متاح' : land.status}</span>
                        </div>
                        <p className="text-black/80 leading-relaxed whitespace-pre-wrap">
                            {land.description || "لا يوجد وصف."}
                        </p>
                        {land.latitude && land.longitude && (
                            <p className="mt-4 text-sm text-gray-500">الإحداثيات: {land.latitude}, {land.longitude}</p>
                        )}
                    </div>

                    {/* Owner Actions */}
                    <div className="border-t border-[#A1BC98]/30 pt-6 flex justify-end gap-3">
                        <Link
                            href={`/mylands/edit/${id}`}
                            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <Edit className="h-5 w-5" /> تعديل العقار
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <Trash className="h-5 w-5" />}
                            حذف
                        </button>
                    </div>

                </article>
            </div>
        </main>
    );
}
