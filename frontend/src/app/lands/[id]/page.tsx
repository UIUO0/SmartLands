"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MapPin, Square, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LandDetailsPage() {
  const { id } = useParams(); // نأخذ رقم الأرض من الرابط
  const [land, setLand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLandDetails() {
      try {
        // نطلب التفاصيل من الباك-إند (سنحتاج لإنشاء هذا البروكسي لاحقاً، لكن مبدئياً سيعمل لو البروكسي العام شغال)
        // أو يمكنك استخدام /api/lands مع فلترة، لكن الأفضل عمل route خاص
        // مؤقتاً سنفترض وجود /api/lands/[id]
        const res = await fetch(`/api/lands/${id}`); 
        if (res.ok) {
            const data = await res.json();
            setLand(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLandDetails();
  }, [id]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold mb-4 hover:underline">
                <ArrowLeft className="h-4 w-4"/> Back to Dashboard
            </Link>

            {loading ? <div>Loading details...</div> : land ? (
                <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                    <h1 className="text-3xl font-bold mb-2">{land.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mb-6">
                        <MapPin className="h-5 w-5"/> {land.city}
                    </div>
                    {/* يمكنك إكمال التصميم هنا لاحقاً */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 p-4 rounded-xl">
                            <span className="block text-xs font-bold uppercase text-gray-500">Price</span>
                            <span className="text-xl font-bold">{land.price_amount?.toLocaleString()} SAR</span>
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl">
                            <span className="block text-xs font-bold uppercase text-gray-500">Area</span>
                            <span className="text-xl font-bold">{land.area_sq_m} m²</span>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-700 leading-relaxed">{land.description}</p>
                </div>
            ) : (
                <div>Land not found via API yet. (Need to setup Proxy Route)</div>
            )}
        </div>
      </main>
    </div>
  );
}