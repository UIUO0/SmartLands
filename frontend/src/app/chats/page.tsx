"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect, useRef } from "react";
import { Send, Search, User, MessageCircle, Loader2 } from "lucide-react";

export default function ChatsPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations
    useEffect(() => {
        async function loadConversations() {
            try {
                const res = await fetch('/api/chats');
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                    // Auto-select first conversation
                    if (data.length > 0 && !selectedConversationId) {
                        setSelectedConversationId(data[0].conversation_id);
                    }
                }
            } catch (e) {
                console.error("Failed to load conversations:", e);
            } finally {
                setLoading(false);
            }
        }
        loadConversations();
    }, []);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedConversationId) return;

        async function loadMessages() {
            setLoadingMessages(true);
            try {
                const res = await fetch(`/api/chats/${selectedConversationId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (e) {
                console.error("Failed to load messages:", e);
            } finally {
                setLoadingMessages(false);
            }
        }
        loadMessages();
    }, [selectedConversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const activeConversation = conversations.find(c => c.conversation_id === selectedConversationId);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversationId) return;

        setSending(true);
        try {
            const res = await fetch(`/api/chats/${selectedConversationId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content_text: messageInput,
                    attachment_url: ""
                })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages([...messages, newMessage]);
                setMessageInput("");
            } else {
                alert("فشل إرسال الرسالة");
            }
        } catch (e) {
            console.error("Failed to send message:", e);
            alert("خطأ في الاتصال");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F1F3E0]">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#556b4d]" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F1F3E0]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                <div className="flex-1 flex overflow-hidden p-6 lg:p-8 gap-6">

                    {/* Conversations List */}
                    <div className="w-full md:w-96 bg-white rounded-3xl flex flex-col border border-[#A1BC98]/30 shadow-sm">
                        <div className="p-6 border-b border-[#F1F3E0]">
                            <h2 className="text-2xl font-bold mb-4 text-black">المحادثات</h2>
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث في المحادثات..."
                                    className="w-full bg-[#F1F3E0] rounded-xl py-3 pr-12 pl-4 outline-none focus:ring-2 focus:ring-[#A1BC98] transition"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>لا توجد محادثات حالياً</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.conversation_id}
                                        onClick={() => setSelectedConversationId(conv.conversation_id)}
                                        className={`w-full flex items-center p-4 rounded-2xl transition hover:bg-[#F9FAFB] ${selectedConversationId === conv.conversation_id ? "bg-[#F1F3E0] border border-[#A1BC98]/50" : ""}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="mr-4 flex-1 text-right">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-bold text-gray-900">{conv.other_party_name || "مستخدم"}</h3>
                                                <span className="text-xs text-gray-500">
                                                    {conv.last_message?.created_at ? new Date(conv.last_message.created_at).toLocaleDateString('ar-SA') : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">
                                                {conv.last_message?.content_text || "لا توجد رسائل"}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white rounded-3xl flex flex-col border border-[#A1BC98]/30 shadow-sm overflow-hidden">
                        {activeConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-[#F1F3E0] flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{activeConversation.other_party_name || "مستخدم"}</h3>
                                            <span className="text-xs text-gray-500">محادثة #{activeConversation.conversation_id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <p>لا توجد رسائل. ابدأ المحادثة!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.sender_id === activeConversation.sender_id; // Adjust based on your auth
                                            return (
                                                <div key={msg.message_id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe
                                                        ? "bg-black text-white rounded-br-none"
                                                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                                        }`}>
                                                        <p className="leading-relaxed">{msg.content_text}</p>
                                                        <span className={`text-[10px] block mt-2 text-left opacity-70 ${isMe ? "text-gray-300" : "text-gray-400"}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-[#F1F3E0]">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="اكتب رسالتك هنا..."
                                            disabled={sending}
                                            className="flex-1 bg-[#F1F3E0] rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#A1BC98] transition disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !messageInput.trim()}
                                            className="bg-[#A1BC98] text-black p-4 rounded-xl hover:bg-[#8ea885] transition flex items-center justify-center transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sending ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5 rotate-180" />
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="bg-[#F1F3E0] p-6 rounded-full mb-4">
                                    <MessageCircle className="h-10 w-10 text-[#A1BC98]" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600">اختر محادثة لبدء المراسلة</h3>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
