"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MapPin, ArrowLeft, Maximize, Calendar, User, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LandDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [land, setLand] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    async function loadData() {
        if (!id) return;
        try {
            // 1. جلب تفاصيل الأرض
            const landRes = await fetch(`/api/lands/${id}`);
            if (!landRes.ok) throw new Error("Land not found");
            const landData = await landRes.json();
            setLand(landData);

            // 2. جلب الصور الخاصة بالأرض
            const imgRes = await fetch(`/api/lands/${id}/images`);
            if (imgRes.ok) {
                const imgs = await imgRes.json();
                setImages(imgs);
                // تعيين الصورة الأولى كصورة رئيسية
                if (imgs.length > 0) {
                    const cover = imgs.find((i: any) => i.is_cover) || imgs[0];
                    setActiveImage(cover.file_url);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary"/>
    </div>
  );

  if (!land) return (
      <div className="flex min-h-screen bg-background items-center justify-center flex-col gap-4">
          <p className="text-xl font-bold opacity-50">لم يتم إيجاد الأرض</p>
          <button onClick={() => router.back()} className="text-primary font-bold hover:underline">عودة</button>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* زر العودة */}
                <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold mb-6 opacity-60 hover:opacity-100 transition">
                    <ArrowLeft className="h-4 w-4"/> العودة للأراضي
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* قسم الصور */}
                    <div className="space-y-4">
                        <div className="aspect-[4/3] w-full bg-gray-200 rounded-3xl overflow-hidden border border-border shadow-sm relative">
                            <img 
                                src={activeImage || "/placeholder.svg"} 
                                alt={land.title} 
                                className="w-full h-full object-cover transition-all duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                                {land.status || "For Sale"}
                            </div>
                        </div>
                        {/* معرض الصور المصغرة */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img: any) => (
                                    <button 
                                        key={img.id} 
                                        onClick={() => setActiveImage(img.file_url)}
                                        className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition ${activeImage === img.file_url ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                                    >
                                        <img src={img.file_url} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* تفاصيل المعلومات */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-2">{land.title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-lg">
                                <MapPin className="h-5 w-5 text-primary"/> 
                                <span>{land.city}, {land.region || "Saudi Arabia"}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-card rounded-3xl border border-border space-y-6">
                            <div className="flex justify-between items-end border-b border-black/10 pb-6">
                                <div>
                                    <p className="text-sm font-bold uppercase opacity-50 mb-1">السعر</p>
                                    <p className="text-3xl font-bold text-foreground">{land.price_amount?.toLocaleString()} <span className="text-lg font-normal">SAR</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold uppercase opacity-50 mb-1">Area</p>
                                    <div className="flex items-center gap-1 text-xl font-bold">
                                        <Maximize className="h-5 w-5"/>
                                        {land.area_sq_m} <span className="text-sm">m²</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-3">الوصف</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {land.description || "No description provided for this property."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary-foreground"/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase opacity-50">Listed By</p>
                                        <p className="font-bold text-sm">المالك #{land.owner_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary-foreground"/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase opacity-50">Listed On</p>
                                        <p className="font-bold text-sm">
                                            {land.created_at ? new Date(land.created_at).toLocaleDateString() : "Recent"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* زر التواصل أو الشراء (سنفعله لاحقاً) */}
                        <button className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition shadow-lg mt-auto">
                            طلب شراء
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}