import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    // Endpoint حسب التوثيق: POST /lands
    const res = await fetch(`${API_URL}/lands`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json();
        return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (e) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}