"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { FileText } from "lucide-react";

export default function RequestsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
             <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="h-6 w-6"/> Requests & Offers
                </h1>
                
                {/* Placeholder للقائمة */}
                <div className="bg-card rounded-3xl p-8 text-center border border-border">
                    <p className="text-muted-foreground">You have no pending requests.</p>
                </div>
             </div>
        </div>
      </main>
    </div>
  );
}