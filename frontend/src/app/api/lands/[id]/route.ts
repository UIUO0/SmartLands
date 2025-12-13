import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/config";

// 👇 التعديل هنا: استخدم رابط Railway بدلاً من localhost
const BACKEND_URL = "https://smartlands-production.up.railway.app";

// 1. GET: جلب تفاصيل أرض محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // طباعة للتأكد من الرابط في الـ Console تبع السيرفر
    console.log(`Fetching land ${id} from: ${BACKEND_URL}/lands/${id}`);

    const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      // إذا رجع الباك إند 404 يعني الأرض غير موجودة
      console.error(`Backend returned ${res.status} for land ${id}`);
      return NextResponse.json({ error: "Land not found" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    console.error("GET Land Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ... (باقي دوال PATCH و DELETE كما هي)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${COOKIE_NAME}=${token}`,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND_URL}/lands/${id}`, {
      method: "DELETE",
      headers: { "Cookie": `${COOKIE_NAME}=${token}` },
    });

    if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: res.status });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Delete Error" }, { status: 500 });
  }
}