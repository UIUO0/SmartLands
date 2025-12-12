"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Bot, Send, Loader2, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "مرحباً! أنا مساعدك الذكي للعقارات. كيف يمكنني مساعدتك اليوم؟"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        // Add AI response
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
        }]);
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F3E0]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden">
          <div className="bg-white rounded-3xl border border-[#A1BC98]/30 shadow-sm flex flex-col h-full overflow-hidden">

            {/* Chat Header */}
            <div className="p-6 border-b border-[#F1F3E0] bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="bg-[#A1BC98]/10 p-3 rounded-2xl">
                  <Bot className="h-6 w-6 text-[#556b4d]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">المساعد الذكي</h1>
                  <p className="text-sm text-gray-500">مساعدك الشخصي للعقارات</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-[#A1BC98]/20 text-[#556b4d]"
                      }`}>
                      {msg.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === "user"
                        ? "bg-black text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                      }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#A1BC98]/20 flex items-center justify-center text-[#556b4d]">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 rounded-bl-none">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#F1F3E0]">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب سؤالك هنا..."
                  disabled={loading}
                  className="flex-1 bg-[#F1F3E0] rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#A1BC98] transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-[#A1BC98] text-black p-4 rounded-xl hover:bg-[#8ea885] transition flex items-center justify-center transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 rotate-180" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}