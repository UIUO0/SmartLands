import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// عنوان الباك-إند الحقيقي
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

// 1. جلب الأراضي (موجودة عندك سابقاً)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies(); // Await is important in newer Next.js
  const token = cookieStore.get("session_id")?.value; // تأكد من اسم الكوكيز عندك

  // إذا كنت تريد جلب أراضي المستخدم فقط، قد تحتاج تغيير الرابط لـ /lands/me/mine حسب الباك إند
  // سأفترض هنا أنك تجلب الكل أو حسب ما هو مكتوب
  const res = await fetch(`${BACKEND_URL}/lands`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// 2. إضافة أرض جديدة (هذا ما نحتاجه الآن)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value; // تأكد أن الاسم يطابق الميدلوير (COOKIE_NAME)

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/lands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // نمرر التوكن للباك إند
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}