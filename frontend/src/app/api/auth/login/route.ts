// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secure = process.env.NODE_ENV === "production";

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

  const token = data?.access_token || data?.token;

  const res = NextResponse.json({ ok: true });

  if (token) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return res;
}
