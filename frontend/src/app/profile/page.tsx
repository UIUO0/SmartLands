"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { User, Mail, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // جلب بيانات المستخدم
    async function loadProfile() {
        try {
            const res = await fetch("/api/users/me");
            if (res.ok) setUser(await res.json());
        } catch(e) { console.error(e); }
    }
    loadProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-border mb-4 overflow-hidden">
                        {user?.picture_url ? <img src={user.picture_url} className="w-full h-full object-cover"/> : <User className="h-10 w-10 text-gray-400"/>}
                    </div>
                    <h1 className="text-2xl font-bold">{user?.full_name || "Guest User"}</h1>
                    <p className="text-gray-600">{user?.email}</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/60 p-4 rounded-xl flex items-center gap-4">
                        <Mail className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Email</p>
                            <p className="font-semibold">{user?.email || "Not logged in"}</p>
                        </div>
                    </div>
                    <div className="bg-white/60 p-4 rounded-xl flex items-center gap-4">
                        <Shield className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Role</p>
                            <p className="font-semibold">{user?.role || "Visitor"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}