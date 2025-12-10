"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { User, Mail, Shield, Camera } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me"); // نقطة الاتصال التي بنيناها سابقاً
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            {loading ? (
              <div className="text-center py-20">Loading profile...</div>
            ) : user ? (
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full bg-secondary border-4 border-white shadow-md flex items-center justify-center relative overflow-hidden">
                        {user.picture_url ? (
                            <img src={user.picture_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-foreground/50" />
                        )}
                    </div>
                    <button className="flex items-center gap-2 text-sm font-bold text-foreground bg-white/50 px-4 py-2 rounded-xl hover:bg-white transition">
                        <Camera className="h-4 w-4" /> Change Photo
                    </button>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Full Name</label>
                            <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl border border-border/50">
                                <User className="h-5 w-5 text-primary" />
                                <span className="font-semibold">{user.full_name || "N/A"}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email Address</label>
                            <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl border border-border/50">
                                <Mail className="h-5 w-5 text-primary" />
                                <span className="font-semibold">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Account Role</label>
                        <div className="flex items-center gap-3 bg-primary/20 p-4 rounded-xl border border-primary/30 w-fit">
                            <Shield className="h-5 w-5 text-foreground" />
                            <span className="font-bold">{user.role || "User"}</span>
                        </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p>Please log in to view your profile.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}