import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function PATCH(
  request: NextRequest,
  // 1️⃣ التغيير هنا: تعريف params كـ Promise
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
    // 2️⃣ التغيير هنا: انتظار الـ params
    const { id } = await params;
    
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}