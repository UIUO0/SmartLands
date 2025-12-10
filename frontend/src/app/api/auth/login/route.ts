import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config"; // استيراد الثابت

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secure = process.env.NODE_ENV === "production";

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
    });
  }

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
}