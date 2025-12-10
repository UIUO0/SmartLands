import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  
  // اسم الكوكيز حسب توثيق الباك-إند هو 'access_token'
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Guest" }, { status: 401 });
  }

  const backendRes = await fetch(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Cookie": `access_token=${token}`, // <--- هام جداً
    },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: backendRes.status });
  }

  const data = await backendRes.json();
  return NextResponse.json(data, { status: 200 });
}