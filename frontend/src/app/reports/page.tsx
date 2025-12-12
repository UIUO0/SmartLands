"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect } from "react";
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Report {
    report_id: number;
    user_reporter_id: number;
    user_reported_id: number;
    conversation_id: number;
    report_reason: string;
    report_status: string;
    created_at?: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<Report[]>([]);
    const [fetchingReports, setFetchingReports] = useState(false);

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

    // Fetch user's reports
    useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchReports() {
            setFetchingReports(true);
            try {
                const res = await fetch("/api/reports/sent");
                if (res.ok) {
                    const data = await res.json();
                    setReports(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Failed to fetch reports:", e);
            } finally {
                setFetchingReports(false);
            }
        }

        fetchReports();
    }, [isAuthenticated]);

    const getStatusBadge = (status: string) => {
        const statusLower = status?.toLowerCase() || "";

        if (statusLower === "valid" || statusLower === "verified" || statusLower === "approved") {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    صحيح
                </span>
            );
        } else if (statusLower === "invalid" || statusLower === "rejected" || statusLower === "dismissed") {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3" />
                    غير صحيح
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-yellow-100 text-yellow-700">
                    <Clock className="h-3 w-3" />
                    قيد المراجعة
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
                            البلاغات
                        </h1>

                        {fetchingReports ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-[#556b4d]" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>لا توجد بلاغات حالياً</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div key={report.report_id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#A1BC98]/20">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg mb-1">
                                                    بلاغ #{report.report_id}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    محادثة #{report.conversation_id}
                                                </p>
                                            </div>
                                            {getStatusBadge(report.report_status)}
                                        </div>
                                        <div className="bg-[#F9FAFB] p-3 rounded-xl mb-3">
                                            <p className="text-sm font-medium text-gray-700">
                                                السبب: <span className="text-black">{report.report_reason}</span>
                                            </p>
                                        </div>
                                        {report.created_at && (
                                            <p className="text-xs text-gray-400">
                                                {new Date(report.created_at).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
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
