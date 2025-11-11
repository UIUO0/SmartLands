import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  // مرر كل الـ query params كما هي للباك إند
  const url = new URL(req.url);
  const target = `${API_URL}/lands?${url.searchParams.toString()}`;

  const upstream = await fetch(target, {
    method: "GET",
    // مهم جدًا لتفادي الكاش على الحافة
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const text = await upstream.text(); // نقرأ كـ نص أولاً لأغراض الديبغ

  // حاول تحويله JSON لو ممكن
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* يظل نص */ }

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, status: upstream.status, error: data ?? text },
      { status: upstream.status }
    );
  }

  // backend يرجع { total, items: [...] }
  return NextResponse.json(data ?? { ok: true, raw: text }, { status: 200 });
}
