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
    const [isSeller, setIsSeller] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check if current user is seller when conversation changes
    useEffect(() => {
        if (!selectedConversationId || !currentUserId) return;

        async function checkSellerStatus() {
            try {
                const res = await fetch(`/api/chats/${selectedConversationId}/seller`);
                if (res.ok) {
                    const data = await res.json();
                    setIsSeller(data.seller_user_id === currentUserId);
                }
            } catch (e) {
                console.error("Failed to check seller status:", e);
                setIsSeller(false);
            }
        }
        checkSellerStatus();
    }, [selectedConversationId, currentUserId]);

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
        let hasAutoSelected = false;

        async function loadConversations() {
            try {
                const res = await fetch('/api/chats');
                if (res.ok) {
                    const data = await res.json();
                    const convArray = data.items || [];

                    console.log("🔄 Raw conversations:", convArray);
                    console.log("👤 Current User ID for matching:", currentUserId);

                    // Fetch profile pictures for all conversations
                    const conversationsWithPics = await Promise.all(convArray.map(async (conv: any) => {
                        // If picture is already present, return
                        if (conv.other_party_picture_url) {
                            console.log(`✅ Pic exists for chat ${conv.conversation_id}`);
                            return conv;
                        }

                        // Need to know who the other party is. 
                        let targetId = conv.other_party_id;

                        // If no explicit other ID, derive it
                        if (!targetId && currentUserId) {
                            if (conv.buyer_user_id === currentUserId) {
                                targetId = conv.seller_user_id;
                            } else if (conv.seller_user_id === currentUserId) {
                                targetId = conv.buyer_user_id;
                            }
                            console.log(`🧩 Derived targetId ${targetId} for chat ${conv.conversation_id} (Me: ${currentUserId}, Buyer: ${conv.buyer_user_id}, Seller: ${conv.seller_user_id})`);
                        } else if (!targetId) {
                            console.log(`⚠️ Cannot derive targetId for chat ${conv.conversation_id} - CurrentUser missing?`);
                        }

                        if (targetId) {
                            try {
                                console.log(`🔍 Fetching user ${targetId} info...`);
                                const userRes = await fetch(`/api/users/${targetId}`);
                                if (userRes.ok) {
                                    const userData = await userRes.json();
                                    console.log(`📸 Got pic for user ${targetId}:`, userData.picture_url);
                                    return {
                                        ...conv,
                                        other_party_picture_url: userData.picture_url,
                                        other_party_id: targetId // Update this too for reference
                                    };
                                } else {
                                    console.error(`❌ Failed to fetch user ${targetId}: ${userRes.status}`);
                                }
                            } catch (e) {
                                console.error(`Failed to fetch pic for user ${targetId}`, e);
                            }
                        }

                        return conv;
                    }));

                    setConversations(conversationsWithPics);

                    if (conversationsWithPics.length > 0 && !selectedConversationId && !hasAutoSelected) {
                        setSelectedConversationId(conversationsWithPics[0].conversation_id);
                        hasAutoSelected = true;
                    }
                }
            } catch (err) {
                console.error("Failed to load conversations:", err);
                setConversations([]);
            } finally {
                setLoading(false);
            }
        }

        if (currentUserId) {
            loadConversations();
        } else {
            // Logic to load initially even if user is not set, but we won't get pics yet
            // Actually, better to wait for currentUserId to avoid double calls causing flickering
            // But we need to show SOMETHING.
            // Let's allow loading raw list first, then re-load when user is set.
            loadConversations();
        }

        const interval = setInterval(loadConversations, 5000);
        return () => clearInterval(interval);
    }, [currentUserId]); // Add currentUserId dependency so we can use it if needed

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



    // Helper to update specific conversation with picture
    const fetchConversationImage = async (conversation: any) => {
        if (conversation.other_party_picture_url || !currentUserId) return conversation;

        let targetId = conversation.other_party_id;

        // If no explicit other ID, derive it
        if (!targetId && currentUserId) {
            if (conversation.buyer_user_id === currentUserId) {
                targetId = conversation.seller_user_id;
            } else if (conversation.seller_user_id === currentUserId) {
                targetId = conversation.buyer_user_id;
            }
        }

        if (targetId) {
            try {
                const res = await fetch(`/api/users/${targetId}`);
                if (res.ok) {
                    const data = await res.json();
                    return { ...conversation, other_party_picture_url: data.picture_url, other_party_id: targetId };
                }
            } catch (e) { console.error(e); }
        }
        return conversation;
    };

    // Effect to enrich conversations with pictures whenever conversations or currentUserId changes
    useEffect(() => {
        if (!currentUserId || conversations.length === 0) return;

        const enrichConversations = async () => {
            const updated = await Promise.all(conversations.map(fetchConversationImage));
            // Only update if there are changes to avoid infinite loop
            const hasChanges = updated.some((c, i) => c.other_party_picture_url !== conversations[i].other_party_picture_url);
            if (hasChanges) {
                setConversations(updated);
            }
        };

        // enriching... this might cause loop if not careful.
        // Better approach: do it in the loadConversations but we need currentUserId there.
        // Since we added dependency on currentUserId in the main load effect, we should handle it there.
        // Therefore, this separate effect might be redundant or conflicting if not careful.
        // Let's rely on the main loadConversations function which we updated to include logic.

    }, [currentUserId]); // We can remove this if we merged logic into loadConversations properly.
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

        setSubmittingReport(true);
        try {
            // Fetch both buyer and seller IDs for this conversation
            const [buyerRes, sellerRes] = await Promise.all([
                fetch(`/api/chats/${selectedConversationId}/buyer`),
                fetch(`/api/chats/${selectedConversationId}/seller`)
            ]);

            if (!buyerRes.ok || !sellerRes.ok) {
                alert("❌ لا يمكن تحديد المستخدم المبلغ عنه");
                setSubmittingReport(false);
                return;
            }

            const buyerData = await buyerRes.json();
            const sellerData = await sellerRes.json();

            const buyerId = buyerData.buyer_user_id;
            const sellerId = sellerData.seller_user_id;

            // Determine who to report: if current user is buyer, report seller; if seller, report buyer
            let reportedUserId: number;
            if (currentUserId === buyerId) {
                reportedUserId = sellerId;
            } else if (currentUserId === sellerId) {
                reportedUserId = buyerId;
            } else {
                alert("❌ خطأ في تحديد المستخدم");
                setSubmittingReport(false);
                return;
            }

            // Submit the report
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_reporter_id: currentUserId,
                    user_reported_id: reportedUserId,
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

    const handleAgree = async () => {
        if (!selectedConversationId) return;
        if (!confirm("هل أنت متأكد من إتمام الاتفاق؟ سيتم وضع علامة 'تم البيع' على العقار.")) return;

        try {
            const res = await fetch(`/api/chats/${selectedConversationId}/agree`, { method: "POST" });
            if (res.ok) {
                alert("✅ تم تأكيد الاتفاق وتحديث حالة العقار");
            } else {
                alert("❌ فشل تأكيد الاتفاق");
            }
        } catch (e) {
            console.error("Agree error:", e);
            alert("❌ خطأ في الاتصال");
        }
    };

    const handleDisagree = async () => {
        if (!selectedConversationId) return;
        if (!confirm("هل أنت متأكد من إلغاء الاتفاق؟ سيتم إعادة عرض العقار للبيع.")) return;

        try {
            const res = await fetch(`/api/chats/${selectedConversationId}/disagree`, { method: "POST" });
            if (res.ok) {
                alert("✅ تم إلغاء الاتفاق");
            } else {
                alert("❌ فشل إلغاء الاتفاق");
            }
        } catch (e) {
            console.error("Disagree error:", e);
            alert("❌ خطأ في الاتصال");
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
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
                                            {conv.other_party_picture_url ? (
                                                <img
                                                    src={conv.other_party_picture_url}
                                                    alt={conv.other_party_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-6 w-6" />
                                            )}
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
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {activeConversation.other_party_picture_url ? (
                                                <img
                                                    src={activeConversation.other_party_picture_url}
                                                    alt={activeConversation.other_party_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-5 w-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{activeConversation.other_party_name || "مستخدم"}</h3>
                                            <span className="text-xs text-gray-500">محادثة #{activeConversation.conversation_id}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isSeller && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-sm font-bold text-gray-700 ml-2">بشر اتفقتوا ؟</span>
                                                <button
                                                    onClick={handleAgree}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-bold text-sm"
                                                >
                                                    اتفقنا
                                                </button>
                                                <button
                                                    onClick={handleDisagree}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold text-sm"
                                                >
                                                    ما اتفقتنا
                                                </button>
                                                <div className="w-px h-8 bg-gray-200 mx-2"></div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                                            title="إبلاغ عن المحادثة"
                                        >
                                            <Flag className="h-5 w-5" />
                                        </button>
                                    </div>
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
