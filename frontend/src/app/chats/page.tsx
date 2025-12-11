"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState } from "react";
import { Send, Search, MoreVertical, Phone, Video, Info, User, MessageCircle } from "lucide-react";

// Dummy Data for Chats
const DUMMY_CHATS = [
    {
        id: 1,
        name: "عبدالله محمد",
        avatar: "",
        lastMessage: "هل الأرض ما زالت متاحة؟",
        time: "10:30 ص",
        unread: 2,
        online: true,
    },
    {
        id: 2,
        name: "سارة أحمد",
        avatar: "",
        lastMessage: "تم تحويل المبلغ، شكراً لك",
        time: "أمس",
        unread: 0,
        online: false,
    },
    {
        id: 3,
        name: "مكتب الشرق للعقارات",
        avatar: "",
        lastMessage: "ننتظر ردك بخصوص السعر النهائي",
        time: "الإثنين",
        unread: 0,
        online: true,
    }
];

const DUMMY_MESSAGES = [
    { id: 1, senderId: 1, text: "السلام عليكم، هل الأرض في حي الملقا ما زالت موجودة؟", time: "10:00 ص", type: "text" },
    { id: 2, senderId: 0, text: "وعليكم السلام، نعم متاحة.", time: "10:05 ص", type: "text" },
    { id: 3, senderId: 1, text: "كم نهايتها؟", time: "10:15 ص", type: "text" },
    { id: 4, senderId: 0, text: "السعر 3 مليون ونص غير قابل للتفاوض.", time: "10:20 ص", type: "text" },
    { id: 5, senderId: 1, text: "هل الأرض ما زالت متاحة؟", time: "10:30 ص", type: "text" },
];

export default function ChatsPage() {
    const [selectedChat, setSelectedChat] = useState<number | null>(1);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState(DUMMY_MESSAGES);

    const activeChat = DUMMY_CHATS.find(c => c.id === selectedChat);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            senderId: 0, // 0 = Me
            text: messageInput,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            type: "text"
        };

        setMessages([...messages, newMessage]);
        setMessageInput("");
    };

    return (
        <div className="flex min-h-screen bg-[#F1F3E0]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                <div className="flex-1 flex overflow-hidden p-6 lg:p-8 gap-6">

                    {/* Sidebar List */}
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
                            {DUMMY_CHATS.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat.id)}
                                    className={`w-full flex items-center p-4 rounded-2xl transition hover:bg-[#F9FAFB] ${selectedChat === chat.id ? "bg-[#F1F3E0] border border-[#A1BC98]/50" : ""}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                                            {chat.avatar ? <img src={chat.avatar} alt={chat.name} /> : <User className="h-6 w-6" />}
                                        </div>
                                        {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                                    </div>
                                    <div className="mr-4 flex-1 text-right">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-gray-900">{chat.name}</h3>
                                            <span className="text-xs text-gray-500">{chat.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                    {chat.unread > 0 && (
                                        <div className="mr-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                            {chat.unread}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white rounded-3xl flex flex-col border border-[#A1BC98]/30 shadow-sm overflow-hidden">
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-[#F1F3E0] flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{activeChat.name}</h3>
                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                {activeChat.online ? "● متصل الآن" : "آخر ظهور " + activeChat.time}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="h-5 w-5" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><Video className="h-5 w-5" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><Info className="h-5 w-5" /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical className="h-5 w-5" /></button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.senderId === 0 ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${msg.senderId === 0
                                                ? "bg-black text-white rounded-br-none"
                                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                                }`}>
                                                <p className="leading-relaxed">{msg.text}</p>
                                                <span className={`text-[10px] block mt-2 text-left opacity-70 ${msg.senderId === 0 ? "text-gray-300" : "text-gray-400"}`}>
                                                    {msg.time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-[#F1F3E0]">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="اكتب رسالتك هنا..."
                                            className="flex-1 bg-[#F1F3E0] rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#A1BC98] transition"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-[#A1BC98] text-black p-4 rounded-xl hover:bg-[#8ea885] transition flex items-center justify-center transform hover:scale-105 active:scale-95"
                                        >
                                            <Send className="h-5 w-5 rotate-180" />
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
