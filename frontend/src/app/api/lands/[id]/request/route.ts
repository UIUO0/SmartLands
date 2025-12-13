import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. قراءة معرف الأرض
    const { id } = await params;

    // 2. قراءة التوكن من الكوكيز (باستخدام الاسم الموحد sl_token)
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    // إذا لم يوجد توكن، نرجع 401 (وهذا ما يسبب التوجيه للدخول حالياً)
    if (!token) {
      return NextResponse.json({ message: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    // 3. إرسال الطلب للباك-إند (التصحيح: استخدام Bearer Header)
    const backendRes = await fetch(`${API_URL}/lands/${id}/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // <--- هذا هو السطر الأهم للتصحيح
        "Accept": "application/json",
      },
    });

    // 4. قراءة رد الباك-إند
    // قد لا يرجع JSON في حالة الأخطاء، لذا نقرأ النص أولاً
    const responseText = await backendRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { detail: responseText };
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        data || { message: "فشل الطلب" },
        { status: backendRes.status }
      );
    }

    // نجاح
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Buy Request Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}