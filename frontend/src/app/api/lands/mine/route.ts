import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// رابط الباك-إند
const API_BASE_URL = "https://smartlands-production.up.railway.app"; 

export async function GET() {
  // ✅ التصحيح: أضفنا await هنا لأن cookies() أصبحت Promise في Next.js 15
  const cookieStore = await cookies();
  
  // نفترض أن اسم الكوكيز هو session_id حسب ملخصك
  const token = cookieStore.get("session_id")?.value || cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    // استدعاء الباك-إند لجلب أراضي المستخدم فقط
    const res = await fetch(`${API_BASE_URL}/lands/me/mine`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
      },
      cache: "no-store",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}