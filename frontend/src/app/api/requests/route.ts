import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json([], { status: 401 });

  // جلب الطلبات من الباك-إند
  const res = await fetch(`${API_URL}/lands/requests/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json([], { status: res.status });

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}