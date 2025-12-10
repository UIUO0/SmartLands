"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { Check, X, MessageCircle, Clock, FileText, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ... (نفس الـ Type RequestItem السابق)
type RequestItem = {
  request_id: number;
  land_id: number;
  from_user_id: number;
  to_user_id: number;
  status: "pending" | "accepted" | "rejected";
  amount?: number;
  created_at?: string;
};

export default function RequestsPage() {
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [myOrders, setMyOrders] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 1. جلب الطلبات المرسلة (My Orders)
      const sentRes = await fetch("/api/requests"); // هذا يجلب sent requests
      const sentData = sentRes.ok ? await sentRes.json() : [];

      // 2. جلب الطلبات الواردة (Incoming) - الراوت الجديد
      const receivedRes = await fetch("/api/requests/incoming");
      const receivedData = receivedRes.ok ? await receivedRes.json() : [];

      setMyOrders(sentData);
      setIncomingRequests(receivedData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // دالة التعامل مع القبول والرفض
  async function handleAction(requestId: number, action: "accept" | "reject") {
    if (!confirm(action === "accept" ? "هل أنت متأكد من قبول البيع؟" : "هل تريد رفض الطلب؟")) return;
    
    setProcessingId(requestId);
    try {
        const res = await fetch(`/api/requests/${requestId}/${action}`, { method: "POST" });
        if (res.ok) {
            // تحديث القائمة الواردة محلياً
            setIncomingRequests(prev => prev.map(r => 
                r.request_id === requestId ? { ...r, status: action === "accept" ? "accepted" : "rejected" } : r
            ));
            
            if (action === "accept") alert("تم القبول! يمكنك الآن بدء الدردشة.");
        } else {
            alert("فشلت العملية");
        }
    } catch (e) {
        alert("حدث خطأ في الاتصال");
    } finally {
        setProcessingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-8 text-black flex items-center gap-2">
                <FileText className="h-8 w-8"/> إدارة الطلبات
            </h1>

            {loading ? (
                 <div className="text-center py-20 text-[#556b4d] animate-pulse">جارِ تحميل الطلبات...</div>
            ) : (
                <div className="space-y-10">
                    
                    {/* === القسم الأول: طلبات واردة لأراضيك === */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-[#3a4430] flex items-center gap-2">
                            <ArrowDownLeft className="h-6 w-6 text-green-700"/>
                            طلبات الشراء الواردة (Incoming)
                        </h2>
                        
                        {incomingRequests.length === 0 ? (
                            <div className="bg-[#D2DCB6]/30 p-8 rounded-2xl text-center text-gray-500 border border-[#A1BC98]/30">
                                لا توجد طلبات شراء لأراضيك حالياً.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {incomingRequests.map((req) => (
                                    <div key={req.request_id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#A1BC98]/30 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-[#556b4d] uppercase mb-1">رقم الطلب #{req.request_id}</p>
                                                <p className="font-bold text-lg">أرض رقم {req.land_id}</p>
                                                <p className="text-sm text-gray-500">من المستخدم #{req.from_user_id}</p>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>

                                        {req.amount && (
                                            <div className="bg-[#F1F3E0] p-3 rounded-xl mb-4 text-center">
                                                <span className="text-xs text-gray-500 font-bold block">العرض المقدم</span>
                                                <span className="text-xl font-bold text-black">{req.amount.toLocaleString()} ر.س</span>
                                            </div>
                                        )}

                                        {/* أزرار التحكم */}
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                <button 
                                                    onClick={() => handleAction(req.request_id, "reject")}
                                                    disabled={processingId === req.request_id}
                                                    className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-xl font-bold hover:bg-red-100 transition flex justify-center items-center gap-2"
                                                >
                                                    <X className="h-4 w-4"/> رفض
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(req.request_id, "accept")}
                                                    disabled={processingId === req.request_id}
                                                    className="flex-1 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-[#333] transition flex justify-center items-center gap-2"
                                                >
                                                    {processingId === req.request_id ? <Loader2 className="animate-spin h-4 w-4"/> : <Check className="h-4 w-4"/>}
                                                    قبول
                                                </button>
                                            </div>
                                        )}

                                        {req.status === 'accepted' && (
                                            <Link href={`/chats`} className="block w-full bg-[#A1BC98] text-black py-3 rounded-xl font-bold text-center hover:bg-[#8ea885] transition flex items-center justify-center gap-2">
                                                <MessageCircle className="h-5 w-5"/> بدء المحادثة
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="border-t border-[#A1BC98]/30"></div>

                    {/* === القسم الثاني: طلباتي المرسلة === */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-[#3a4430] flex items-center gap-2">
                            <ArrowUpRight className="h-6 w-6 text-blue-700"/>
                            طلباتي المرسلة (My Orders)
                        </h2>

                        {myOrders.length === 0 ? (
                            <div className="bg-[#D2DCB6]/30 p-8 rounded-2xl text-center text-gray-500 border border-[#A1BC98]/30">
                                لم تقم بإرسال أي طلبات شراء حتى الآن.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myOrders.map((req) => (
                                    <div key={req.request_id} className="bg-white/60 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#D2DCB6] h-12 w-12 rounded-full flex items-center justify-center font-bold text-black">
                                                {req.land_id}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-black">طلب شراء أرض #{req.land_id}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <Clock className="h-3 w-3"/> {req.created_at ? new Date(req.created_at).toLocaleDateString('ar-SA') : 'منذ فترة'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            {req.amount && (
                                                <span className="font-bold text-lg">{req.amount.toLocaleString()} ر.س</span>
                                            )}
                                            
                                            <StatusBadge status={req.status} />

                                            {req.status === 'accepted' && (
                                                <Link href={`/chats`} className="bg-black text-white p-2 rounded-lg hover:bg-[#333] transition" title="فتح الدردشة">
                                                    <MessageCircle className="h-5 w-5"/>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        accepted: "bg-green-100 text-green-800 border-green-200",
        rejected: "bg-red-50 text-red-800 border-red-100",
    };
    
    const labels = {
        pending: "قيد الانتظار",
        accepted: "تمت الموافقة",
        rejected: "مرفوض",
    };

    const s = status as keyof typeof styles;
    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${styles[s] || "bg-gray-100 text-gray-800"}`}>
            {labels[s] || status}
        </span>
    );
}