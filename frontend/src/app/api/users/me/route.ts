import { NextRequest, NextResponse } from "next/server";
<<<<<<< HEAD
import { cookies } from "next/headers";

// تأكد أن هذه المتغيرات مضبوطة في ملف env
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";
=======
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

// دالة مساعدة لجلب التوكن
async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e

// 1. جلب البيانات (GET)
export async function GET(req: NextRequest) {
<<<<<<< HEAD
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
=======
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ message: "Error" }, { status: res.status });
  
  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

// 2. تعديل البيانات (PATCH) - جديد
export async function PATCH(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    const res = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json();
        return NextResponse.json(err, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
>>>>>>> 8e7c4b6b13ef7c7c58c5b1e153d93c094a50788e
  }
}