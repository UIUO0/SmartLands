import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

// رابط الباك-إند كما ورد في التوثيق
const BACKEND_URL = "http://localhost:8000"; //  تأكد أن هذا الرابط هو المستخدم عندك (local أو railway)

// 1. GET: لجلب صور الأرض
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // استدعاء endpoint جلب الصور من الباك-إند
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images`, { // [cite: 29]
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
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
  
  // استخراج التوكن للتحقق (محمي) [cite: 30]
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    // استقبال البيانات (الصورة) من الفرونت
    const formData = await request.formData();
    
    // إرسالها للباك-إند
    // ملاحظة: fetch سيقوم تلقائياً بضبط Content-Type: multipart/form-data مع الـ boundary الصحيح
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images/upload`, { // [cite: 30]
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`, // [cite: 2]
      },
      body: formData, 
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Backend Upload Failed:", errorData);
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json(); // المتوقع: LandImageOut [cite: 30]
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}