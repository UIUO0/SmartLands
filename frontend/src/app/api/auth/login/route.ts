import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

    // 1. إرسال بيانات الدخول للباك-إند
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // 2. إنشاء الرد للفرونت-إند
    const response = NextResponse.json(data, { status: 200 });

    // 3. سحب الكوكيز من رد الباك-إند ووضعها في رد النيكست
    // هذه الخطوة الأهم: نقل 'access_token' للمتصفح
    const setCookieHeader = res.headers.get("set-cookie");
    
    if (setCookieHeader) {
      // تنظيف الهيدر وتعيينه في المتصفح
      // نقوم بتقسيم الكوكيز إذا كان هناك أكثر من واحد
      const cookies = setCookieHeader.split(/,(?=\s*[^;]+=[^;]+)/);
      
      cookies.forEach((cookie) => {
         response.headers.append("Set-Cookie", cookie);
      });
    }

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: "Network Error" }, { status: 500 });
  }
}