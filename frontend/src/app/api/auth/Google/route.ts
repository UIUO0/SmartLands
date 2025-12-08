import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function POST(req: Request) {
  try {
    const { id_token } = await req.json(); // [cite: 12]

    // 1. إرسال التوكن للباك-إند للتحقق وتسجيل الدخول
    const res = await fetch(`${BACKEND_URL}/auth/google`, { // [cite: 11]
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }), // [cite: 12]
    });

    if (!res.ok) {
      return NextResponse.json({ detail: "Google Login Failed" }, { status: 400 });
    }

    const data = await res.json(); // [cite: 13]

    // 2. حفظ التوكن في الكوكيز (لأننا في البروكسي)
    const cookieStore = await cookies();
    
    // حفظ التوكن باسم sl_token (المعتمد عندنا)
    cookieStore.set("sl_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // أسبوع
      path: "/",
    });

    // حفظ بيانات المستخدم في كوكيز (اختياري، للعرض فقط)
    cookieStore.set("user_data", JSON.stringify(data.user), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}