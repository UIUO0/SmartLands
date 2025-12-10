"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { User, Mail, LogOut, LogIn, UserPlus, Camera, Edit2, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // حالات نافذة التعديل
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", picture_url: "" });
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
            const data = await res.json();
            setUser(data);
            setEditForm({ full_name: data.full_name || "", picture_url: data.picture_url || "" });
        } else {
            setUser(null);
        }
    } catch(e) { 
        setUser(null);
    } finally {
        setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        router.push("/login");
        router.refresh();
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const res = await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            setUser(updatedUser); // تحديث البيانات المعروضة فوراً
            setIsEditing(false);  // إغلاق النافذة
        } else {
            alert("فشل التحديث، يرجى المحاولة لاحقاً");
        }
    } catch (error) {
        console.error("Update error:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
            
            <div className="w-full max-w-lg bg-[#D2DCB6] rounded-3xl p-8 border border-[#A1BC98]/50 shadow-lg relative">
                
                {loading ? (
                    <div className="text-center py-10 animate-pulse text-[#556b4d]">جارِ تحميل البيانات...</div>
                ) : (
                    <>
                        {user ? (
                             // === حالة المستخدم المسجل ===
                            <>
                                <div className="flex flex-col items-center text-center mb-8">
                                    {/* الصورة مع زر التعديل */}
                                    <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
                                        <div className="w-32 h-32 bg-[#F1F3E0] rounded-full flex items-center justify-center border-4 border-white mb-4 overflow-hidden shadow-sm">
                                            {user.picture_url ? (
                                                <img src={user.picture_url} alt="Profile" className="w-full h-full object-cover"/>
                                            ) : (
                                                <User className="h-14 w-14 text-[#A1BC98]"/>
                                            )}
                                        </div>
                                        {/* Overlay عند المرور بالماوس */}
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-4">
                                            <Camera className="text-white h-8 w-8" />
                                        </div>
                                    </div>

                                    {/* الاسم والزر */}
                                    <div className="flex items-center gap-2 justify-center">
                                        <h1 className="text-3xl font-bold text-black">{user.full_name}</h1>
                                        <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-black/10 rounded-full transition">
                                            <Edit2 className="h-4 w-4 text-gray-600"/>
                                        </button>
                                    </div>
                                    
                                    <p className="text-[#3a4430] font-medium mt-1">{user.email}</p>
                                </div>

                                <div className="space-y-4">
                                    {/* خانة الإيميل فقط */}
                                    <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                                        <div className="bg-[#F1F3E0] p-2 rounded-lg">
                                            <Mail className="h-5 w-5 text-black"/>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#556b4d]">البريد الإلكتروني</p>
                                            <p className="font-semibold text-black">{user.email}</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </>
                        ) : (
                            // === حالة الزائر ===
                            <div className="text-center">
                                <div className="w-24 h-24 bg-[#F1F3E0] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                                    <User className="h-10 w-10 text-[#A1BC98]"/>
                                </div>
                                <h2 className="text-xl font-bold mb-6">أهلاً بك يا زائر</h2>
                                <div className="space-y-3">
                                    <Link href="/login" className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#333] transition shadow-md">
                                        <LogIn className="h-5 w-5" /> تسجيل الدخول
                                    </Link>
                                    <Link href="/signup" className="w-full bg-white text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition border border-[#A1BC98] shadow-sm">
                                        <UserPlus className="h-5 w-5" /> إنشاء حساب جديد
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* === نافذة التعديل (Modal) === */}
        {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#F1F3E0] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">تعديل الملف الشخصي</h3>
                        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-black/10 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#556b4d] mb-1">الاسم الكامل</label>
                            <input 
                                type="text" 
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                className="w-full p-3 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                placeholder="أدخل اسمك"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#556b4d] mb-1">رابط الصورة (URL)</label>
                            <input 
                                type="url" 
                                value={editForm.picture_url}
                                onChange={(e) => setEditForm({...editForm, picture_url: e.target.value})}
                                className="w-full p-3 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white text-left"
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-gray-500 mt-1">* حالياً ندعم روابط الصور المباشرة فقط.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                            >
                                إلغاء
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="flex-1 py-3 font-bold text-white bg-black rounded-xl hover:bg-[#333] transition disabled:opacity-50"
                            >
                                {isSaving ? "جارِ الحفظ..." : "حفظ التغييرات"}
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