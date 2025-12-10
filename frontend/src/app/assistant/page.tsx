"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Bot } from "lucide-react";

export default function AssistantPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-card p-8 rounded-full mb-6">
                <Bot className="h-16 w-16 text-foreground/50" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Smart Assistant</h1>
            <p className="text-muted-foreground max-w-md">
                AI Assistant will be here to help you navigate and answer your real estate questions.
            </p>
        </div>
      </main>
    </div>
  );
}