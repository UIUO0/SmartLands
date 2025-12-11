import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

// دالة مساعدة لجلب التوكن
async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

// 1. جلب البيانات (GET)
export async function GET() {
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

  } catch {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}