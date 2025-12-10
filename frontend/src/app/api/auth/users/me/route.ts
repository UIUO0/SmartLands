import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, COOKIE_NAME } from "@/lib/config";

export async function GET(req: NextRequest) {
  // 1. قراءة الكوكيز من المتصفح
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  // إذا لم يوجد توكن، المستخدم زائر (401)
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. إرسال الطلب للباك-إند مع الكوكيز في الهيدر الصحيح
    const backendRes = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        // انتبه: الباك-إند يتوقع هيدر Cookie وليس Authorization
        "Cookie": `${COOKIE_NAME}=${token.value}`,
      },
      cache: "no-store",
    });

    if (!backendRes.ok) {
      // إذا رفض الباك-إند التوكن (منتهي الصلاحية مثلاً)
      return NextResponse.json({ message: "Session Expired" }, { status: 401 });
    }

    const data = await backendRes.json();
    
    // نجاح! نرجع بيانات المستخدم JSON
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}