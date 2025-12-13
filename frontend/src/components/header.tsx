"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function Header() {
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch("/api/requests/incoming");
        if (res.status === 401) {
          // User is not logged in, just ignore
          return;
        }
        if (res.ok) {
          const data = await res.json();
          // Adjust logic based on actual API response structure
          // Assuming array of requests, check for any 'pending' status
          const pending = Array.isArray(data) ? data.filter((r: any) => r.status === 'pending') : [];
          setHasNotifications(pending.length > 0);
        }
      } catch (error) {
        console.error("Failed to check notifications", error);
      }
    }

    checkNotifications();
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Title (Optional if sidebar is hidden) */}
        <h2 className="text-xl font-bold text-foreground md:hidden">Smart Lands</h2>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/requests" className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors relative block">
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}