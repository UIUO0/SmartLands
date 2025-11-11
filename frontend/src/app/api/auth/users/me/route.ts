import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    // لا ترجع 401 للواجهة؛ رجّع حالة مصادقة false
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const r = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // حاول قراءة JSON، ولو فشل ارجع نص
  const raw = await r.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = raw; }

  if (!r.ok) {
    // 401 من الباك إند = التوكن منتهي/غير صالح
    if (r.status === 401) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json({ authenticated: false, error: data }, { status: r.status });
  }

  return NextResponse.json({ authenticated: true, user: data }, { status: 200 });
}
