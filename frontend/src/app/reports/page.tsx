"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect } from "react";
import { FileText, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"my-reports" | "team-responses">("my-reports");

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

    // Dummy data for user's reports
    const myReports = [
        {
            id: 1,
            conversation_id: 12,
            reported_user: "أحمد العتيبي",
            reason: "كلام بذيء",
            status: "pending",
            created_at: "2024-01-15T10:30:00",
        },
        {
            id: 2,
            conversation_id: 24,
            reported_user: "فهد السعيد",
            reason: "عدم الجديه",
            status: "reviewed",
            created_at: "2024-01-10T15:45:00",
        },
        {
            id: 3,
            conversation_id: 8,
            reported_user: "سارة المطيري",
            reason: "محاولة احتيال",
            status: "resolved",
            created_at: "2024-01-05T09:20:00",
        },
    ];

    // Dummy data for team responses
    const teamResponses = [
        {
            id: 1,
            report_id: 3,
            conversation_id: 8,
            message: "شكراً لتبليغك. تم اتخاذ الإجراءات اللازمة ضد المستخدم المخالف. تم إغلاق حسابه بشكل مؤقت.",
            status: "closed",
            created_at: "2024-01-06T14:30:00",
        },
        {
            id: 2,
            report_id: 2,
            conversation_id: 24,
            message: "تم مراجعة البلاغ. وجدنا أن المحادثة تحتوي على بعض المخالفات. سيتم إرسال تحذير للمستخدم المعني.",
            status: "in_progress",
            created_at: "2024-01-12T11:00:00",
        },
    ];

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { text: string; className: string; icon: any }> = {
            pending: { text: "قيد المراجعة", className: "bg-yellow-100 text-yellow-700", icon: Clock },
            reviewed: { text: "تمت المراجعة", className: "bg-blue-100 text-blue-700", icon: CheckCircle },
            resolved: { text: "تم الحل", className: "bg-green-100 text-green-700", icon: CheckCircle },
            in_progress: { text: "جاري المعالجة", className: "bg-orange-100 text-orange-700", icon: Clock },
            closed: { text: "مغلق", className: "bg-gray-100 text-gray-700", icon: CheckCircle },
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badge.className}`}>
                <Icon className="h-3 w-3" />
                {badge.text}
            </span>
        );
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
        return null; // Will redirect in useEffect
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

                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab("my-reports")}
                                className={`pb-3 px-4 font-bold transition ${activeTab === "my-reports"
                                    ? "text-[#556b4d] border-b-2 border-[#A1BC98]"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                بلاغاتي ({myReports.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("team-responses")}
                                className={`pb-3 px-4 font-bold transition ${activeTab === "team-responses"
                                    ? "text-[#556b4d] border-b-2 border-[#A1BC98]"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                ردود الفريق ({teamResponses.length})
                            </button>
                        </div>

                        {/* My Reports Tab */}
                        {activeTab === "my-reports" && (
                            <div className="space-y-4">
                                {myReports.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p>لا توجد بلاغات حالياً</p>
                                    </div>
                                ) : (
                                    myReports.map((report) => (
                                        <div key={report.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#A1BC98]/20">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg mb-1">
                                                        بلاغ عن: {report.reported_user}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        محادثة #{report.conversation_id}
                                                    </p>
                                                </div>
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <div className="bg-[#F9FAFB] p-3 rounded-xl mb-3">
                                                <p className="text-sm font-medium text-gray-700">
                                                    السبب: <span className="text-black">{report.reason}</span>
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {new Date(report.created_at).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Team Responses Tab */}
                        {activeTab === "team-responses" && (
                            <div className="space-y-4">
                                {teamResponses.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p>لا توجد ردود من الفريق حالياً</p>
                                    </div>
                                ) : (
                                    teamResponses.map((response) => (
                                        <div key={response.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#A1BC98]/20">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-[#A1BC98]/20 flex items-center justify-center">
                                                        <MessageSquare className="h-5 w-5 text-[#556b4d]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm">فريق الدعم</h3>
                                                        <p className="text-xs text-gray-500">
                                                            بخصوص البلاغ #{response.report_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(response.status)}
                                            </div>
                                            <div className="bg-[#F1F3E0] p-4 rounded-xl mb-3">
                                                <p className="text-sm leading-relaxed text-gray-800">
                                                    {response.message}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {new Date(response.created_at).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
