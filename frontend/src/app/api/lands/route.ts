import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

// رابط الباك-إند الرسمي
const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  
  // ✅ التعديل هنا: البحث عن sl_token أولاً (حسب الصورة) ثم session_id كاحتياط
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
        "Authorization": `Bearer ${token}`, // تمرير التوكن ضروري لمعرفة صاحب الأرض
      },
      body: JSON.stringify(body),
    });

    // إذا فشل الباك-إند (مثلاً بيانات ناقصة) نرجع الخطأ للفرونت
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }

    // نجاح الإضافة
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}