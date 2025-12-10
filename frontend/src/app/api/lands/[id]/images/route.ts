import { NextResponse, type NextRequest } from "next/server";

// رابط الباك-إند
const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // استخراج رقم الأرض

    // نطلب الصور من الباك-إند الحقيقي
    const res = await fetch(`${BACKEND_URL}/lands/${id}/images`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Image Proxy Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}