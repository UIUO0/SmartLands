import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

// رابط الباك-إند الرسمي
const BACKEND_URL = "https://smartlands-production.up.railway.app";

// 1. دالة GET: لجلب الأراضي وعرضها في الداشبورد
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  try {
    // نطلب البيانات من الباك-إند
    const res = await fetch(`${BACKEND_URL}/lands`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // نمرر التوكن لو موجود (لأن بعض البيانات قد تكون خاصة)
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      // cache: 'no-store' مهمة جداً عشان البيانات تتحدث فوراً عند أي تغيير
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Backend Error:", await res.text());
      return NextResponse.json({ error: "Failed to fetch lands" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("GET Lands Error:", error);
    return NextResponse.json(
      { detail: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. دالة POST: لإضافة أرض جديدة (نفس كودك مع تحسينات بسيطة)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  // البحث عن sl_token أولاً ثم session_id
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized - No Token Found" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/lands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ضروري لربط الأرض بالمستخدم
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error("POST Land Error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}