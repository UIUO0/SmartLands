"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
<<<<<<< HEAD
import { User, Mail, LogOut, LogIn, UserPlus, Camera, Edit2, X } from "lucide-react";
=======
import { User, Mail, LogOut, Camera, Edit2, X, Save, Loader2 } from "lucide-react";
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
<<<<<<< HEAD
  // حالات نافذة التعديل
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", picture_url: "" });
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
=======
  // حالات التعديل (Modal)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", picture_url: "" });
  const [isSaving, setIsSaving] = useState(false);
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e

  const router = useRouter();

  // جلب البيانات عند التحميل
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
            const data = await res.json();
            setUser(data);
<<<<<<< HEAD
            setEditForm({ full_name: data.full_name || "", picture_url: data.picture_url || "" });
=======
            // تعبئة الفورم بالبيانات الحالية
            setEditForm({ 
                full_name: data.full_name || "", 
                picture_url: data.picture_url || "" 
            });
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
        } else {
            setUser(null);
        }
    } catch(e) { 
<<<<<<< HEAD
=======
        console.error(e);
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
        setUser(null);
    } finally {
        setLoading(false);
    }
  }

<<<<<<< HEAD
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

=======
  // دالة حفظ التعديلات
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
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
<<<<<<< HEAD
            setUser(updatedUser); // تحديث البيانات المعروضة فوراً
            setIsEditing(false);  // إغلاق النافذة
        } else {
            alert("فشل التحديث، يرجى المحاولة لاحقاً");
        }
    } catch (error) {
        console.error("Update error:", error);
=======
            setUser(updatedUser); // تحديث الواجهة فوراً
            setIsEditing(false);  // إغلاق النافذة
        } else {
            alert("فشل التحديث، تأكد من صحة البيانات");
        }
    } catch (error) {
        console.error("Update failed", error);
        alert("حدث خطأ في الاتصال");
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
    } finally {
        setIsSaving(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      
=======
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

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
            
            <div className="w-full max-w-lg bg-[#D2DCB6] rounded-3xl p-8 border border-[#A1BC98]/50 shadow-lg relative">
                
                {loading ? (
<<<<<<< HEAD
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
=======
                    <div className="text-center py-10 text-[#556b4d] animate-pulse flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>جارِ تحميل الملف الشخصي...</span>
                    </div>
                ) : user ? (
                    // === واجهة المستخدم المسجل ===
                    <>
                        <div className="flex flex-col items-center text-center mb-8">
                            {/* الصورة مع زر تعديل خفي */}
                            <div 
                                className="relative group cursor-pointer w-32 h-32 mb-4"
                                onClick={() => setIsEditing(true)}
                            >
                                <div className="w-full h-full bg-[#F1F3E0] rounded-full flex items-center justify-center border-4 border-white overflow-hidden shadow-sm">
                                    {user.picture_url ? (
                                        <img src={user.picture_url} alt="Profile" className="w-full h-full object-cover"/>
                                    ) : (
                                        <User className="h-14 w-14 text-[#A1BC98]"/>
                                    )}
                                </div>
                                {/* أيقونة الكاميرا تظهر عند التمرير */}
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Camera className="text-white h-8 w-8" />
                                </div>
                            </div>

                            {/* الاسم وزر التعديل */}
                            <div className="flex items-center gap-2 justify-center mb-1">
                                <h1 className="text-3xl font-bold text-black">{user.full_name}</h1>
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="p-1.5 hover:bg-black/10 rounded-full transition text-gray-700"
                                    title="تعديل الملف الشخصي"
                                >
                                    <Edit2 className="h-4 w-4"/>
                                </button>
                            </div>
                            <p className="text-[#3a4430] font-medium dir-ltr">{user.email}</p>
                        </div>

                        <div className="space-y-4">
                            {/* بطاقة الإيميل */}
                            <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                                <div className="bg-[#F1F3E0] p-2.5 rounded-xl">
                                    <Mail className="h-5 w-5 text-black"/>
                                </div>
                                <div className="flex-1 text-right">
                                    <p className="text-xs font-bold uppercase text-[#556b4d] mb-0.5">البريد الإلكتروني</p>
                                    <p className="font-semibold text-black break-all">{user.email}</p>
                                </div>
                            </div>

                            {/* زر تسجيل الخروج */}
                            <button 
                                onClick={handleLogout}
                                className="w-full mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20"
                            >
                                <LogOut className="h-5 w-5" />
                                تسجيل الخروج
                            </button>
                        </div>
                    </>
                ) : (
                    // === واجهة الزائر ===
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-[#F1F3E0] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                            <User className="h-8 w-8 text-[#A1BC98]"/>
                        </div>
                        <h2 className="text-xl font-bold mb-6 text-black">أهلاً بك يا زائر</h2>
                        <div className="space-y-3">
                            <Link href="/login" className="block w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#333] transition shadow-md">
                                تسجيل الدخول
                            </Link>
                            <Link href="/signup" className="block w-full bg-white text-black font-bold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition border border-[#A1BC98]">
                                إنشاء حساب جديد
                            </Link>
                        </div>
                    </div>
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
                )}
            </div>
        </div>

        {/* === نافذة التعديل (Modal) === */}
        {isEditing && (
<<<<<<< HEAD
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
=======
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
                                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                className="w-full p-3.5 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white text-black placeholder-gray-400 transition"
                                placeholder="الاسم الظاهر للمستخدمين"
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
                            />
                        </div>

                        <div>
<<<<<<< HEAD
                            <label className="block text-sm font-bold text-[#556b4d] mb-1">رابط الصورة (URL)</label>
=======
                            <label className="block text-sm font-bold text-[#556b4d] mb-2">رابط الصورة الشخصية</label>
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
                            <input 
                                type="url" 
                                value={editForm.picture_url}
                                onChange={(e) => setEditForm({...editForm, picture_url: e.target.value})}
<<<<<<< HEAD
                                className="w-full p-3 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white text-left"
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-gray-500 mt-1">* حالياً ندعم روابط الصور المباشرة فقط.</p>
=======
                                className="w-full p-3.5 rounded-xl border border-[#A1BC98] focus:outline-none focus:ring-2 focus:ring-black bg-white text-black placeholder-gray-400 transition text-left dir-ltr"
                                placeholder="https://example.com/photo.jpg"
                            />
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
<<<<<<< HEAD
                                className="flex-1 py-3 font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
=======
                                className="flex-1 py-3.5 font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
                            >
                                إلغاء
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSaving}
<<<<<<< HEAD
                                className="flex-1 py-3 font-bold text-white bg-black rounded-xl hover:bg-[#333] transition disabled:opacity-50"
                            >
=======
                                className="flex-1 py-3.5 font-bold text-white bg-black rounded-xl hover:bg-[#333] transition disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5"/>}
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
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