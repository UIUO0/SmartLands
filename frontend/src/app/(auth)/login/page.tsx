// src/app/(auth)/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (r.ok) router.push(next);
    else alert("Invalid credentials");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md grid gap-3 border p-6 rounded-2xl"
      >
        <h1 className="text-2xl font-semibold">Login</h1>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full border rounded-xl px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full border rounded-xl px-3 py-2"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="text-right mt-1">
            <a
              href="/Forget_password"
              className="text-sm text-black underline"
            >
              نسيت كلمة المرور؟
            </a>
          </div>
        </div>

        {/* زر جوجل للدخول */}
        <div className="w-full flex justify-center py-2">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const r = await fetch("/api/auth/google", {
                method: "POST",
                body: JSON.stringify({ id_token: credentialResponse.credential })
              });
              if (r.ok) {
                const data = await r.json();
                let targetUrl = next;

                // إذا كان مستخدم جديد، نضيف علامة للرابط
                if (data.is_new_user) {
                  const separator = targetUrl.includes("?") ? "&" : "?";
                  targetUrl += `${separator}first_time=true`;
                }

                // استخدام window.location للإجبار على تحديث كامل للصفحة (لإصلاح مشاكل الكوكيز)
                window.location.href = targetUrl;
              } else {
                alert("Google Login Failed");
              }
            }}
            onError={() => {
              alert("Google Login Failed");
            }}
          />
        </div>

        <button className="rounded-xl bg-black text-white py-2" disabled={loading}>
          {loading ? "..." : "Login"}
        </button>

        <div className="text-sm text-gray-600 text-center mt-2">
          ما عندك حساب؟{" "}
          <a
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="underline text-black"
          >
            إنشاء حساب
          </a>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
