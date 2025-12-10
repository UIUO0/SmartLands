import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

// 👇 التعديل هنا: استخدام رابط Railway بدلاً من localhost
const BACKEND_URL = "https://smartlands-production.up.railway.app";

// 1. GET: لجلب قائمة صور الأرض
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // نطلب قائمة الصور من الباك-إند
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images`, {
      cache: "no-store",
    });

    if (!res.ok) {
        // إذا لم توجد صور أو حدث خطأ، نرجع مصفوفة فارغة لكي لا يتوقف الموقع
        return NextResponse.json([], { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Images Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// 2. POST: لرفع صورة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData, 
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
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