"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LayoutDashboard, Map, User, LogOut } from "lucide-react"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const toggleSidebar = () => setIsOpen(!isOpen)

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Map, label: "My Lands", href: "/mylands" },
    { icon: User, label: "Profile", href: "/profile" },
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
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-black text-white p-2 rounded-xl shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={toggleSidebar} />}

      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-[#D2DCB6] border-r border-[#A1BC98] z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 flex flex-col shadow-xl`}
      >
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">
              SL
            </div>
            <span className="font-bold text-2xl tracking-tight text-black">Smart Lands</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
                    isActive 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-800 hover:bg-[#A1BC98]/50 hover:text-black"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User & Logout */}
        <div className="mt-auto p-8 border-t border-[#A1BC98]/30">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-700 hover:bg-red-100/50 transition-colors w-full font-semibold"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  )
}