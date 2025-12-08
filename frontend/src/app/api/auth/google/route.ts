import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function POST(req: Request) {
  try {
    const { id_token } = await req.json();
    

    
    // إرسال التوكن للباك-إند
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    });

    // 🔍 قراءة رد الباك-إند بالكامل سواء كان نجاح أو فشل
    const data = await res.json();

    if (!res.ok) {
      // طباعة الخطأ في التيرمنال لنعرف السبب
      console.error("❌ Backend Google Auth Error:", data);
      
      // إرجاع تفاصيل الخطأ للفرونت
      return NextResponse.json(
        { detail: data.detail || "رفض الباك-إند عملية الدخول" }, 
        { status: res.status }
      );
    }

    // النجاح
    const cookieStore = await cookies();
    cookieStore.set("sl_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, 
      path: "/",
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Server Proxy Error:", error.message);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}