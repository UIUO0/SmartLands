import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = "https://smartlands-production.up.railway.app"; 

export async function GET() {
  const cookieStore = await cookies();
  
  // ✅ التصحيح: أضفنا sl_token للقائمة
  const token = cookieStore.get("sl_token")?.value || cookieStore.get("session_id")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized - Token not found" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/lands/me/mine`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
      },
      cache: "no-store",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}