"use client"

import { Bell } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Title (Optional if sidebar is hidden) */}
        <h2 className="text-xl font-bold text-foreground md:hidden">Smart Lands</h2>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
          </button>

          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
            U
          </div>
        </div>
      </div>
    </header>
  )
}