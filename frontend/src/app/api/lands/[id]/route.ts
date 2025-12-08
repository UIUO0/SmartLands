import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

// ✅ التصحيح: params يجب أن يكون Promise
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
    // ✅ انتظار params
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