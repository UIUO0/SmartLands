import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config"; // استيراد الثابت

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

<<<<<<< HEAD
    // 1. إرسال طلب الدخول للباك-إند
    const backendRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
=======
  // 1. طلب التوكن من الباك-إند
  const r = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(data || { message: "Login failed" }, {
      status: r.status,
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // 2. تجهيز الرد للفرونت-إند
    const response = NextResponse.json(data, { status: 200 });

    // 3. سحب الكوكيز من الباك-إند وتمريرها للمتصفح
    // هذه الخطوة الأهم: قراءة Set-Cookie من هيدر الباك-إند
    const setCookieHeader = backendRes.headers.get("set-cookie");

    if (setCookieHeader) {
      // تنظيف النص لاستخراج القيمة فقط إذا لزم الأمر، أو تمريره كما هو
      // Next.js في بعض الاستضافات يحتاج لتقسيم الكوكيز
      const cookies = setCookieHeader.split(/,(?=\s*[^;]+=[^;]+)/);
      
      cookies.forEach((cookie) => {
        // نضبط الكوكيز في استجابة Next.js
        response.headers.append("Set-Cookie", cookie);
      });
    } else {
        // في حالة لم يرسل الباك إند كوكي (نادر الحدوث مع JWT HttpOnly)
        // نقوم بإنشاء كوكي يدوياً إذا كان التوكن موجوداً في الـ Body (احتياط)
        if (data.access_token) {
            response.cookies.set(COOKIE_NAME, data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // أسبوع
            });
        }
    }

    return response;

  } catch (error) {
    console.error("Login Proxy Error:", error);
    return NextResponse.json({ message: "Connection Failed" }, { status: 500 });
  }
<<<<<<< HEAD
=======

  // 2. استخراج التوكن
  // ملاحظة: الباك-إند يرجع { access_token: "...", token_type: "bearer" }
  const token = data?.access_token || data?.token;

  const res = NextResponse.json({ ok: true, ...data });

  // 3. حفظ التوكن في المتصفح باستخدام الاسم الموحد "sl_token"
  if (token) {
    res.cookies.set({
      name: COOKIE_NAME, // سيأخذ القيمة "sl_token" من الكونفق
      value: token,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });
  }

  return res;
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
}