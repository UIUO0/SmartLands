import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/config";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  try {
    // 1. استخراج فلاتر البحث من رابط الطلب القادم من الفرونت
    // مثال: يمسك ?q=villa&city=Riyadh
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // 2. إرسال الفلاتر إلى الباك-إند
    const res = await fetch(`${BACKEND_URL}/lands?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Cookie": `${COOKIE_NAME}=${token}` }),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch lands" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch {
    return NextResponse.json(
      { detail: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// أبقِ دالة POST كما هي إذا كانت موجودة في نفس الملف
export async function POST(req: NextRequest) {
  // ... (نفس كود الإضافة السابق)
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/lands`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": `${COOKIE_NAME}=${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}