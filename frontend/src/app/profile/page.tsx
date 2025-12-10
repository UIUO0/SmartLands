"use client";

import { Sidebar } from "@/components/sidebar"; 
import { Header } from "@/components/header"; 
import { User, Mail, Shield, LogOut, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
        try {
            const res = await fetch("/api/users/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch(e) { 
            console.error(e); 
            setUser(null);
        } finally {
            setLoading(false);
        }
    }
    loadProfile();
  }, []);

  // دالة تسجيل الخروج
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
      {/* السايدبار ثابت */}
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* الهيدر */}
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
            
            {/* بطاقة الملف الشخصي */}
            <div className="w-full max-w-lg bg-[#D2DCB6] rounded-3xl p-8 border border-[#A1BC98]/50 shadow-lg">
                
                {loading ? (
                    <div className="text-center py-10 animate-pulse text-[#556b4d]">جارِ تحميل البيانات...</div>
                ) : (
                    <>
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-28 h-28 bg-[#F1F3E0] rounded-full flex items-center justify-center border-4 border-white mb-4 overflow-hidden shadow-sm">
                                {user?.picture_url ? (
                                    <img src={user.picture_url} alt="Profile" className="w-full h-full object-cover"/>
                                ) : (
                                    <User className="h-12 w-12 text-[#A1BC98]"/>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-black">
                                {user ? user.full_name : "زائر"}
                            </h1>
                            <p className="text-[#3a4430]">
                                {user ? user.email : "يرجى تسجيل الدخول للمتابعة"}
                            </p>
                        </div>

                        {/* إذا كان المستخدم مسجلاً للدخول، اعرض البيانات */}
                        {user ? (
                            <div className="space-y-4">
                                <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                                    <div className="bg-[#F1F3E0] p-2 rounded-lg">
                                        <Mail className="h-5 w-5 text-black"/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#556b4d]">البريد الإلكتروني</p>
                                        <p className="font-semibold text-black">{user.email}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-white/50">
                                    <div className="bg-[#F1F3E0] p-2 rounded-lg">
                                        <Shield className="h-5 w-5 text-black"/>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#556b4d]">الصلاحية</p>
                                        <p className="font-semibold text-black">{user.role || "مستخدم"}</p>
                                    </div>
                                </div>

                                {/* زر تسجيل الخروج */}
                                <button 
                                    onClick={handleLogout}
                                    className="w-full mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20"
                                >
                                    <LogOut className="h-5 w-5" />
                                    تسجيل الخروج
                                </button>
                            </div>
                        ) : (
                            /* إذا لم يكن مسجلاً، اعرض أزرار التسجيل والدخول */
                            <div className="space-y-3 mt-2">
                                <Link 
                                    href="/login"
                                    className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#333] transition shadow-md"
                                >
                                    <LogIn className="h-5 w-5" />
                                    تسجيل الدخول
                                </Link>
                                
                                <Link 
                                    href="/signup"
                                    className="w-full bg-white text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition border border-[#A1BC98] shadow-sm"
                                >
                                    <UserPlus className="h-5 w-5" />
                                    إنشاء حساب جديد
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}