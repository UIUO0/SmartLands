"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { User, Mail, LogOut, Edit2, X, Save, Loader2, Link as LinkIcon, Lock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // حالات التعديل
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: "", picture_url: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Upload state
    const [uploadingImage, setUploadingImage] = useState(false);

    const router = useRouter();

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            // نستخدم الـ API Proxy الذي عدلناه سابقاً (GET /api/users/me)
            const res = await fetch("/api/users/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setEditForm({
                    full_name: data.full_name || "",
                    picture_url: data.picture_url || ""
                });
            } else {
                setUser(null);
            }
        } catch (e) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // نستخدم الـ API Proxy للتعديل (PATCH /api/users/me)
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setIsEditing(false);
            } else {
                alert("فشل تحديث البيانات");
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ في الاتصال");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
            router.refresh();
        } catch (e) { console.error(e); }
    };

    const handleImageClick = () => {
        document.getElementById('profile-image-input')?.click();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setUploadingImage(true);
        try {
            const res = await fetch("/api/users/me/profile-picture", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setEditForm(prev => ({ ...prev, picture_url: updatedUser.picture_url }));
                alert("✅ تم تحديث الصورة الشخصية");
            } else {
                alert("❌ فشل تحديث الصورة");
            }
        } catch (e) {
            console.error("Upload error:", e);
            alert("❌ خطأ في الاتصال");
        } finally {
            setUploadingImage(false);
        }
    };

    // ... (rest of component)

    return (
        <div className="flex min-h-screen bg-[#F1F3E0]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header />

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
                    <div className="w-full max-w-lg bg-[#D2DCB6] rounded-3xl p-8 border border-[#A1BC98]/50 shadow-lg relative">

                        {loading ? (
                            <div className="text-center py-10 text-[#556b4d] animate-pulse">جارِ التحميل...</div>
                        ) : user ? (
                            <>
                                <div className="flex flex-col items-center text-center mb-8">
                                    {/* عرض الصورة */}
                                    <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                        <div className="w-32 h-32 mb-4 bg-[#F1F3E0] rounded-full flex items-center justify-center border-4 border-white overflow-hidden shadow-sm">
                                            {uploadingImage ? (
                                                <Loader2 className="h-10 w-10 animate-spin text-[#556b4d]" />
                                            ) : user.picture_url ? (
                                                <img src={user.picture_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="h-14 w-14 text-[#A1BC98]" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center mb-4">
                                            <Edit2 className="h-8 w-8 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            id="profile-image-input"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <h1 className="text-3xl font-bold text-black">{user.full_name}</h1>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 hover:bg-black/10 rounded-full transition text-gray-700"
                                            title="تعديل البيانات"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-[#3a4430] font-medium dir-ltr">{user.email}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                                        <div className="bg-[#F1F3E0] p-2.5 rounded-xl">
                                            <Mail className="h-5 w-5 text-black" />
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-xs font-bold uppercase text-[#556b4d] mb-0.5">البريد الإلكتروني</p>
                                            <p className="font-semibold text-black break-all">{user.email}</p>
                                        </div>
                                    </div>

                                    <Link href="/reports" className="w-full mt-4 bg-[#A1BC98]/10 hover:bg-[#A1BC98]/20 text-[#556b4d] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-[#A1BC98]/20">
                                        <FileText className="h-5 w-5" />
                                        البلاغات
                                    </Link>

                                    <Link href="/R_Pw" className="w-full mt-2 bg-[#556b4d]/10 hover:bg-[#556b4d]/20 text-[#556b4d] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-[#556b4d]/20">
                                        <Lock className="h-5 w-5" />
                                        تغيير كلمة المرور
                                    </Link>

                                    <button onClick={handleLogout} className="w-full mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20">
                                        <LogOut className="h-5 w-5" /> تسجيل الخروج
                                    </button>
                                </div>
                            </>
                        ) : (
                            // حالة الزائر
                            <div className="text-center py-8">
                                <h2 className="text-xl font-bold mb-6 text-black">أهلاً بك يا زائر</h2>
                                <div className="space-y-3">
                                    <Link href="/login" className="block w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#333]">تسجيل الدخول</Link>
                                    <Link href="/signup" className="block w-full bg-white text-black font-bold py-3.5 px-4 rounded-xl hover:bg-gray-50 border border-[#A1BC98]">إنشاء حساب جديد</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* === نافذة التعديل (Modal) === */}
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-[#F1F3E0] w-full max-w-md rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-[#A1BC98]">
                            <div className="flex justify-between items-center mb-6 border-b border-[#A1BC98]/30 pb-4">
                                <h3 className="text-xl font-bold text-black">تعديل الملف الشخصي</h3>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-black/10 rounded-full transition">
                                    <X className="h-6 w-6 text-gray-700" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#556b4d] mb-2">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="w-full p-3.5 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3.5 font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition">إلغاء</button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3.5 font-bold text-white bg-black rounded-xl hover:bg-[#333] transition disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        {isSaving ? "حفظ" : "حفظ التغييرات"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}