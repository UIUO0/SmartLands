"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  // 1 = إدخال الإيميل، 2 = إدخال الكود وكلمة المرور الجديدة
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const BASE_URL = "/api";

  // --- الخطوة 1: إرسال الكود ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${BASE_URL}/users/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("فشل إرسال الكود، تأكد من الإيميل.");

      setMsg({ type: "success", text: "تم إرسال الكود إلى إيميلك!" });
      setStep(2); // الانتقال للخطوة الثانية
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- الخطوة 2: تأكيد الكود وتغيير الباسوورد ---
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "الكود غير صحيح أو انتهت صلاحيته");
      }

      setMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح! جاري تحويلك..." });

      // توجيه لصفحة الدخول
      setTimeout(() => router.push("/login"), 2000);

    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="mb-2 text-2xl font-bold text-center">إعادة تعيين كلمة المرور</h1>
        <p className="mb-6 text-center text-gray-500 text-sm">
          {step === 1
            ? "أدخل بريدك الإلكتروني لاستلام رمز التحقق"
            : "أدخل الرمز الذي وصلك وكلمة المرور الجديدة"}
        </p>

        {msg && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* --- نموذج الخطوة 1 --- */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                placeholder="name@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "جاري الإرسال..." : "إرسال الرمز"}
            </button>
          </form>
        )}

        {/* --- نموذج الخطوة 2 --- */}
        {step === 2 && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">رمز التحقق (Code)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-black focus:ring-1 focus:ring-black outline-none"
                placeholder="******"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "جاري التحديث..." : "حفظ كلمة المرور الجديدة"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 mt-2 hover:text-black"
            >
              تغيير البريد الإلكتروني
            </button>
          </form>
        )}
      </div>
    </main>
  );
}