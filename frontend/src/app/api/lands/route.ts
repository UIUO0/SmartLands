import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

// Proxy: GET /api/lands?...
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${API_URL}/lands?${url.searchParams.toString()}`;

  // لا تمكّن الكاش على الحافة
  const upstream = await fetch(target, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await upstream.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* يبقى نص */ }

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, status: upstream.status, error: data ?? text },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data ?? { ok: true, raw: text }, { status: 200 });
}
