"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Menu, X, LayoutDashboard, Map, User, LogOut, 
  Bot, FileText, ChevronLeft, ChevronRight, MessageCircle // <-- إضافة هذه
} from "lucide-react"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)       // للجوال
  const [isCollapsed, setIsCollapsed] = useState(false) // للديسك توب
  const [isLoggedIn, setIsLoggedIn] = useState(false)   // لفحص حالة الدخول

  const pathname = usePathname()
  const router = useRouter()

  const toggleMobileSidebar = () => setIsOpen(!isOpen)
  const toggleDesktopCollapse = () => setIsCollapsed(!isCollapsed)

  // 2. القائمة الجديدة كما طلبت
  const navItems = [
    { icon: LayoutDashboard, label: "الصفحة الرئيسية", href: "/dashboard" },
    { icon: Bot, label: "المساعد", href: "/assistant" },
    { icon: Map, label: "أراضي", href: "/mylands" },
    { icon: MessageCircle, label: "الدردشات", href: "/chats" }, // <-- الرابط الجديد
    { icon: FileText, label: "الطلبات", href: "/requests" },
    { icon: User, label: "الحساب", href: "/profile" },
  ]

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      {/* زر القائمة للجوال (يظهر فقط في الشاشات الصغيرة) */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 right-4 z-50 md:hidden bg-black text-white p-2 rounded-xl shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* خلفية معتمة للجوال */}
      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={toggleMobileSidebar} />}

      {/* السايد بار نفسه */}
      <aside
        className={`
            fixed md:relative top-0 h-screen z-40
            bg-[#D2DCB6] border-l md:border-r border-[#A1BC98] shadow-xl
            transition-all duration-300 ease-in-out flex flex-col
            ${isOpen ? "right-0" : "-right-full md:right-0"} /* للجوال: يظهر من اليمين للعربية */
            ${isCollapsed ? "md:w-24" : "md:w-72"} /* للديسك توب: يتحكم بالعرض */
            w-72
        `}
      >
        {/* زر تصغير القائمة (يظهر فقط في الديسك توب) */}
        <button
            onClick={toggleDesktopCollapse}
            className="hidden md:flex absolute -right-3 top-20 bg-black text-white p-1 rounded-full border border-white shadow-md z-50 hover:scale-110 transition-transform"
            style={{ left: isCollapsed ? "calc(100% - 12px)" : "calc(100% - 12px)" }} // تثبيت الزر على الحافة
        >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={`p-6 flex flex-col h-full ${isCollapsed ? "items-center" : ""}`}>
          
          {/* الشعار */}
          <div className={`flex items-center gap-3 mb-10 transition-all ${isCollapsed ? "justify-center" : ""}`}>
            <div className="h-10 w-10 min-w-[2.5rem] bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
              SL
            </div>
            {!isCollapsed && (
              <span className="font-bold text-2xl tracking-tight text-black whitespace-nowrap overflow-hidden">
                Smart Lands
              </span>
            )}
          </div>

          {/* روابط التنقل */}
          <nav className="space-y-3 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : ""} // Tooltip عند التصغير
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium
                    ${isActive 
                        ? "bg-black text-white shadow-md" 
                        : "text-gray-800 hover:bg-[#A1BC98]/50 hover:text-black"
                    }
                    ${isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : ""}
                  `}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? "text-white" : "text-gray-700"}`} />
                  
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* تسجيل الخروج (مشروط) */}
          {isLoggedIn && (
            <div className={`mt-auto pt-6 border-t border-[#A1BC98]/30 w-full`}>
              <button 
                onClick={handleLogout}
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-red-700 hover:bg-red-100/50 transition-colors w-full font-semibold
                    ${isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : ""}
                `}
                title={isCollapsed ? "تسجيل الخروج" : ""}
              >
                <LogOut className="h-6 w-6" />
                {!isCollapsed && <span>تسجيل الخروج</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}