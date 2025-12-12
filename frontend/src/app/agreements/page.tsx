"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect } from "react";
import { FileText, CheckCircle, XCircle, Clock, Loader2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface Agreement {
    agreement_id: number;
    land_id: number;
    buyer_user_id: number;
    seller_user_id: number;
    request_id: number;
    agreed_amount: number;
    status: string;
    created_at: string;
    confirmed_at?: string;
    cancelled_at?: string;
}

export default function AgreementsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [fetchingAgreements, setFetchingAgreements] = useState(false);

    // Check authentication
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/users/me");
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    router.push("/login");
                }
            } catch (e) {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, [router]);

    // Fetch agreements
    useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchAgreements() {
            setFetchingAgreements(true);
            try {
                const res = await fetch("/api/agreements");
                if (res.ok) {
                    const data = await res.json();

                    let items = [];
                    if (Array.isArray(data)) {
                        items = data;
                    } else if (data && Array.isArray(data.items)) {
                        items = data.items;
                    } else if (data && Array.isArray(data.agreements)) {
                        items = data.agreements;
                    } else if (data && Array.isArray(data.data)) {
                        items = data.data;
                    }

                    setAgreements(items);
                } else {
                    console.error("Agreements fetch failed:", await res.text());
                }
            } catch (e) {
                console.error("Failed to fetch agreements:", e);
            } finally {
                setFetchingAgreements(false);
            }
        }

        fetchAgreements();
    }, [isAuthenticated]);

    const getStatusBadge = (status: string) => {
        const statusLower = status?.toLowerCase() || "";

        if (statusLower === "completed" || statusLower === "agreed" || statusLower === "confirmed") {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    مكتمل
                </span>
            );
        } else if (statusLower === "cancelled" || statusLower === "rejected") {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3" />
                    ملغي
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-yellow-100 text-yellow-700">
                    <Clock className="h-3 w-3" />
                    قيد التنفيذ
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F1F3E0] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556b4d] mx-auto mb-4"></div>
                    <p className="text-gray-600">جارِ التحميل...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-[#F1F3E0]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <FileText className="h-8 w-8" />
                            الاتفاقيات
                        </h1>

                        {fetchingAgreements ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-[#556b4d]" />
                            </div>
                        ) : agreements.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>لا توجد اتفاقيات حالياً</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {agreements.map((agreement) => (
                                    <div key={agreement.agreement_id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#A1BC98]/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg mb-1">
                                                    اتفاقية عقار #{agreement.land_id}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>اتفاقية #{agreement.agreement_id}</span>
                                                    <span>•</span>
                                                    <span>طلب #{agreement.request_id}</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(agreement.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-[#F9FAFB] p-3 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">المبلغ المتفق عليه</p>
                                                <p className="font-bold text-lg text-[#556b4d]">
                                                    {agreement.agreed_amount?.toLocaleString() || 0} ر.س
                                                </p>
                                            </div>
                                            <div className="bg-[#F9FAFB] p-3 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">تاريخ الإنشاء</p>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(agreement.created_at).toLocaleDateString('ar-SA', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {(agreement.confirmed_at || agreement.cancelled_at) && (
                                            <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                                                {agreement.confirmed_at && `تم التأكيد في: ${new Date(agreement.confirmed_at).toLocaleDateString('ar-SA')}`}
                                                {agreement.cancelled_at && `تم الإلغاء في: ${new Date(agreement.cancelled_at).toLocaleDateString('ar-SA')}`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
