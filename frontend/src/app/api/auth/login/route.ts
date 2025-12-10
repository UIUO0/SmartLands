import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // رابط الباك-إند
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

    // 1. إرسال بيانات الدخول للباك-إند
    const backendRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 2. التحقق من نجاح الدخول
    if (!backendRes.ok) {
      const errorData = await backendRes.json();
      return NextResponse.json(errorData, { status: backendRes.status });
    }

    const data = await backendRes.json();

    // 3. إنشاء الرد للواجهة
    const response = NextResponse.json(data, { status: 200 });

    // 4. (الخطوة الحاسمة) نقل الكوكيز من الباك-إند إلى المتصفح
    // الباك-إند يرسل 'access_token' في الهيدر، يجب أن نمرره للمستخدم
    const setCookieHeader = backendRes.headers.get("set-cookie");
    
    if (setCookieHeader) {
      // قد يكون هناك أكثر من كوكي، نقسمهم ونضيفهم
      const cookies = setCookieHeader.split(/,(?=\s*[^;]+=[^;]+)/);
      cookies.forEach((cookie) => {
        response.headers.append("Set-Cookie", cookie);
      });
    }

    return response;

  } catch (error) {
    console.error("Login Proxy Error:", error);
    return NextResponse.json({ message: "فشل الاتصال بالخادم" }, { status: 500 });
  }
}