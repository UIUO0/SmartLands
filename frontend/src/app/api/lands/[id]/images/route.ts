// src/app/api/lands/[id]/images/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://smartlands-production.up.railway.app";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  try {
    // 1. استقبال الـ FormData من الفرونت
    const formData = await request.formData();
    
    // 2. إرسالها كما هي للباك إند (مع التوكن)
    // ملاحظة: عند استخدام FormData، لا تضع Content-Type يدوياً، المتصفح يضعه تلقائياً
    const res = await fetch(`${BACKEND_URL}/lands/${params.id}/images/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`, 
      },
      body: formData, 
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