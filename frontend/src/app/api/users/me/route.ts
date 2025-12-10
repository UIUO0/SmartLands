import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// تأكد أن هذه المتغيرات مضبوطة في ملف env
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  
  // 1. جلب التوكن (نبحث عن access_token أو session_id)
  const token = cookieStore.get("access_token")?.value || cookieStore.get("session_id")?.value;

  // إذا لم يوجد توكن، نعيد 401 فوراً ليتمكن الفرونت إند من معرفة أن المستخدم زائر
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. إرسال الطلب للباك-إند (تصحيح الهيدر ليصبح Cookie بدلاً من Bearer)
    const backendRes = await fetch(`${BASE_URL}/users/me`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cookie": `access_token=${token}`, // <--- هذا هو التصحيح الجوهري
      },
      cache: "no-store",
    });

    // 3. معالجة رد الباك-إند
    if (!backendRes.ok) {
      // إذا كان التوكن منتهي الصلاحية أو غير صالح
      return NextResponse.json({ message: "Unauthorized" }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    
    // إرجاع بيانات المستخدم مباشرة (بدون تغليفها بـ authenticated: true)
    // لكي تتوافق مع كود صفحة البروفايل
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}