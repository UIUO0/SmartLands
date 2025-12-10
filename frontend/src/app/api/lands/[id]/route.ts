import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

// تأكد أن هذا الرابط يطابق ما استخدمته في الملفات السابقة
const BACKEND_URL = "http://localhost:8000"; 

// 1. GET: جلب تفاصيل أرض محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Land not found" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PATCH: تعديل بيانات الأرض (للمالك)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
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
        const err = await res.json();
        return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

// 3. DELETE: حذف الأرض (للمالك)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;
  
    if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  
    try {
      const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
  
      if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: res.status });
  
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return NextResponse.json({ error: "Delete Error" }, { status: 500 });
    }
  }