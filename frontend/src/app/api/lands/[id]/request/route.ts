import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ندعم هنا Next.js 15+ حيث يجب انتظار params و cookies
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. استخراج معرف الأرض من الرابط
    const { id } = await params;

    // 2. التحقق من التوكن (Auth)
    const cookieStore = await cookies();
    // نبحث عن access_token (حسب التوثيق) أو session_id (حسب ملاحظاتك) للاحتياط
    const token = cookieStore.get("access_token")?.value || cookieStore.get("session_id")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول أولاً" }, 
        { status: 401 }
      );
    }

    // 3. إعداد رابط الباك-إند
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";
    const apiUrl = `${BASE_URL}/lands/${id}/request`;

    // 4. إرسال الطلب للباك-إند
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // نمرر التوكن في الهيدر ليتعرف الباك-إند على المستخدم
        "Cookie": `access_token=${token}`, 
      },
    });

    // 5. قراءة الرد من الباك-إند
    // قد لا يرجع الباك-إند JSON في حالة الخطأ 500، لذا نستخدم text() أولاً
    const responseText = await res.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText || "حدث خطأ غير متوقع في الخادم" };
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: data.detail || data.message || "فشل إرسال الطلب" }, 
        { status: res.status }
      );
    }

    // نجاح
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("[Buy Request Error]:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الاتصال بالخادم" }, 
      { status: 500 }
    );
  }
}