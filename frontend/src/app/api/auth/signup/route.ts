import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  // الباكند يتوقع full_name — نmapped من name لو اسم الحقل عندك "name"
  const payload = {
    email: body.email,
    full_name: body.full_name ?? body.name,
    password: body.password,
  };

  const upstream = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  // مرّر أي خطأ كما هو
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data || { message: "Signup failed" }, {
      status: upstream.status,
    });
  }

  const token: string | undefined = data?.access_token ?? data?.token;

  // نرجّع بيانات بسيطة + نزرع الكوكي (auto-login)
  const res = NextResponse.json({ ok: true, user: data?.user ?? null }, { status: 201 });

  if (token) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });
  }

  return res;
}
