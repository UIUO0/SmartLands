import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // 1. قراءة الكوكيز من المتصفح
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  // إذا لم يوجد توكن، نرجع 401 فوراً
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

  try {
    // 2. تمرير التوكن للباك-إند
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        // نرسل الكوكي كما يطلبه الباك-إند بالضبط
        "Cookie": `access_token=${token.value}`,
      },
    });

    if (!res.ok) {
        return NextResponse.json(null, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}