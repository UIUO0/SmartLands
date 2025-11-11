import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";

// نضمن قراءة التوكن حتى لو تغيّر مصدره
function extractToken(req: NextRequest): string | undefined {
  // 1) من HttpOnly cookie
  const fromCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (fromCookie) return fromCookie;

  // 2) من هيدر Authorization لو موجود (احتياط)
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();

  // 3) من الهيدر Cookie (fallback نادر)
  const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
  if (cookieHeader) {
    const parts = cookieHeader.split(";").map((s) => s.trim());
    const kv = parts.find((p) => p.startsWith(`${COOKIE_NAME}=`));
    if (kv) return kv.split("=")[1];
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept": "application/json",
    },
    // مهم جداً حتى لا يُخزّن على الحافة
    cache: "no-store",
  });

  // حاول قراءة JSON حتى مع الأخطاء
  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { authenticated: false, error: data || { message: "unauthorized" } },
      { status: upstream.status }
    );
  }

  return NextResponse.json({ authenticated: true, user: data }, { status: 200 });
}
