import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

// 1. GET: لجلب الصور (موجود سابقاً)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images`, {
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

// 2. POST: لرفع صورة جديدة (هذا الجديد)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  // التأكد من التوكن لأن الرابط محمي 
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    // استلام البيانات كـ FormData من الفرونت
    const formData = await request.formData();
    
    // إرسالها للباك-إند
    // ملاحظة: لا نضع Content-Type يدوياً، fetch سيفعل ذلك تلقائياً مع الـ Boundary الصحيح
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images/upload`, { // 
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData, 
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Upload failed:", errorData);
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error("Proxy Upload Error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}