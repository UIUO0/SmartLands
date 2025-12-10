"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
// 1. استيراد زر جوجل
import { GoogleLogin } from "@react-oauth/google";

export const dynamic = "force-dynamic";

function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // دالة التسجيل العادي (كما هي)
  async function handleSignup(e: any) {
    e.preventDefault();
    setLoading(true);

    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);


    
    if (r.ok) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
    } else {
      alert("Signup failed");
    }
  }

  // 2. دالة تسجيل الدخول بجوجل
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // نرسل التوكن للـ Proxy API الذي أنشأناه سابقاً
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credentialResponse.credential }), // [cite: 11, 12]
      });

      if (res.ok) {
        // نجاح -> تحديث الراوتر وتوجيه المستخدم
        router.refresh(); 
        router.push("/mylands"); // نوجهه لصفحة الأراضي مباشرة
      } else {
        alert("فشل تسجيل الدخول بواسطة جوجل");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-[#F1F3E0]">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg border border-[#A1BC98]">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        <form onSubmit={handleSignup} className="grid gap-4">
          <div>
            <label className="text-sm font-semibold">Name</label>
            <Input required value={name} onChange={(e: any) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
          </div>

          <Button loading={loading} type="submit" className="bg-black text-white hover:bg-gray-800">
            Sign up
          </Button>
        </form>

        {/* 3. فاصل جمالي */}
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
        </div>

        {/* 4. زر جوجل */}
        <div className="flex justify-center w-full">
            <GoogleLogin
                onSuccess={handleGoogleSuccess} // 
                onError={() => alert("Login Failed")}
                shape="rectangular" // يمكنك تغييره لـ pill
                width="100%" // ليأخذ عرض الكارت
                locale="en"
            />
        </div>

        <p className="text-sm mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <a className="underline font-bold text-black" href={`/login?next=${encodeURIComponent(next)}`}>
            Login
          </a>
        </p>
      </Card>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-600">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}