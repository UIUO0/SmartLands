import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

// دالة جلب البيانات (موجودة سابقاً)
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { "Cookie": `access_token=${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// دالة التعديل (الجديدة)
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `access_token=${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}