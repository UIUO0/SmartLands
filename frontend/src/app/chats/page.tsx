"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect, useRef } from "react";
import { Send, Search, User, MessageCircle, Loader2, Flag, X } from "lucide-react";

export default function ChatsPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get current user ID
    useEffect(() => {
        async function getCurrentUser() {
            try {
                const res = await fetch('/api/users/me');
                if (res.ok) {
                    const user = await res.json();
                    console.log("👤 Current user data:", user);
                    console.log("👤 Setting currentUserId to:", user.user_id);
                    setCurrentUserId(user.user_id);
                } else {
                    console.error("❌ Failed to get current user, status:", res.status);
                }
            } catch (e) {
                console.error("Failed to get current user:", e);
            }
        }
        getCurrentUser();
    }, []);

    // Load conversations with auto-refresh
    useEffect(() => {
        async function loadConversations() {
            try {
                const res = await fetch('/api/chats');
                if (res.ok) {
                    const data = await res.json();
                    // Handle paginated response format with items array
                    const convArray = data.items || [];
                    setConversations(convArray);
                    // Auto-select first conversation only on initial load
                    if (convArray.length > 0 && !selectedConversationId && conversations.length === 0) {
                        setSelectedConversationId(convArray[0].conversation_id);
                    }
                }
            } catch (e) {
                console.error("Failed to load conversations:", e);
                setConversations([]); // Ensure it's always an array
            } finally {
                setLoading(false);
            }
        }

        loadConversations();

        // Auto-refresh every 2 seconds
        const interval = setInterval(loadConversations, 2000);

        return () => clearInterval(interval);
    }, []);

    // Load messages for selected conversation with auto-refresh
    useEffect(() => {
        if (!selectedConversationId) return;

        let isInitialLoad = true;

        async function loadMessages() {
            // Only show loading spinner on the very first load
            if (isInitialLoad) {
                setLoadingMessages(true);
            }

            try {
                const res = await fetch(`/api/chats/${selectedConversationId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("💬 Messages API response:", data);
                    // Handle both direct array and paginated response format
                    const msgArray = Array.isArray(data) ? data : (data.items || []);
                    console.log("💬 Extracted messages array:", msgArray);
                    setMessages(msgArray);
                } else {
                    console.error("❌ Messages API failed with status:", res.status);
                    setMessages([]);
                }
            } catch (e) {
                console.error("Failed to load messages:", e);
                setMessages([]);
            } finally {
                if (isInitialLoad) {
                    setLoadingMessages(false);
                    isInitialLoad = false;
                }
            }
        }

        loadMessages();

        // Auto-refresh messages every 2 seconds
        const interval = setInterval(loadMessages, 2000);

        return () => clearInterval(interval);
    }, [selectedConversationId]);

    // Scroll to bottom when messages change (only if new messages added)
    useEffect(() => {
        const prevCount = messages.length;
        // Store previous count in a ref to compare on next render
        const scrollBehavior = prevCount === 0 ? "auto" : "smooth";

        // Only auto-scroll if we're near the bottom already or if it's the first load
        const messagesContainer = messagesEndRef.current?.parentElement;
        if (messagesContainer) {
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
            if (isNearBottom || prevCount === 0) {
                messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
            }
        }
    }, [messages.length]); // Only trigger when message count changes

    const activeConversation = conversations.find(c => c.conversation_id === selectedConversationId);

    const handleReport = async () => {
        if (!reportReason || !selectedConversationId || !currentUserId) return;

        const otherPartyId = activeConversation?.other_party_id || activeConversation?.user_id;
        if (!otherPartyId) {
            alert("❌ لا يمكن تحديد المستخدم المبلغ عنه");
            return;
        }

        setSubmittingReport(true);
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_reporter_id: currentUserId,
                    user_reported_id: otherPartyId,
                    conversation_id: selectedConversationId,
                    report_reason: reportReason === "other" ? otherReason : reportReason
                })
            });

            if (res.ok) {
                alert("✅ تم إرسال البلاغ بنجاح");
                setShowReportModal(false);
                setReportReason("");
                setOtherReason("");
            } else {
                alert("❌ فشل إرسال البلاغ");
            }
        } catch (e) {
            console.error("Report error:", e);
            alert("❌ خطأ في الاتصال");
        } finally {
            setSubmittingReport(false);
        }
    };

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
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                                        title="إبلاغ عن المحادثة"
                                    >
                                        <Flag className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB] flex flex-col">
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <p>لا توجد رسائل. ابدأ المحادثة!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, index) => {
                                                const isMe = msg.sender_user_id === currentUserId;
                                                // Debug logging (only for first message to avoid spam)
                                                if (index === 0) {
                                                    console.log("🔍 Message sender check:", {
                                                        sender_user_id: msg.sender_user_id,
                                                        currentUserId: currentUserId,
                                                        isMe: isMe,
                                                        types: `sender: ${typeof msg.sender_user_id}, current: ${typeof currentUserId}`
                                                    });
                                                }
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
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
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

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-black">إبلاغ عن المحادثة</h3>
                                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <X className="h-5 w-5 text-gray-700" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">اختر سبب البلاغ:</p>

                                <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value="كلام بذيء"
                                        checked={reportReason === "كلام بذيء"}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="mr-3"
                                    />
                                    <span className="font-medium">كلام بذيء</span>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value="عدم الجديه"
                                        checked={reportReason === "عدم الجديه"}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="mr-3"
                                    />
                                    <span className="font-medium">عدم الجديه</span>
                                </label>

                                <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value="other"
                                        checked={reportReason === "other"}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="mr-3"
                                    />
                                    <span className="font-medium">أخرى</span>
                                </label>

                                {reportReason === "other" && (
                                    <textarea
                                        value={otherReason}
                                        onChange={(e) => setOtherReason(e.target.value)}
                                        placeholder="اكتب السبب هنا..."
                                        rows={3}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 py-3 font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={submittingReport || !reportReason || (reportReason === "other" && !otherReason.trim())}
                                        className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingReport ? (
                                            <><Loader2 className="h-5 w-5 animate-spin" /> جارِ الإرسال</>
                                        ) : (
                                            <>إرسال البلاغ</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
