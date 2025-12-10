"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LayoutDashboard, Map, User, LogOut, Settings } from "lucide-react"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const toggleSidebar = () => setIsOpen(!isOpen)

  // Smart Lands Navigation
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Map, label: "My Lands", href: "/mylands" }, // صفحة إدارة الأراضي
    { icon: User, label: "Profile", href: "/profile" },
    // { icon: Settings, label: "Settings", href: "/settings" }, // يمكن تفعيلها لاحقاً
  ]

  const handleLogout = async () => {
    try {
      // استدعاء الـ API Proxy الخاص بنا
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition-opacity"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={toggleSidebar} />}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border/50 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 shadow-xl`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10 pt-12 md:pt-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
               {/* يمكنك استبدال هذا بأيقونة الشعار SVG لاحقاً */}
              <span className="font-bold text-lg">SL</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Smart Lands</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                    isActive 
                    ? "bg-primary text-black font-semibold shadow-sm" 
                    : "text-gray-800 hover:bg-primary/40 hover:text-black"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-black" : "text-gray-600 group-hover:text-black"}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User & Logout Section */}
          <div className="pt-6 border-t border-border/40">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-800 hover:bg-red-100 hover:text-red-700 transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}