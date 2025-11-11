import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json({ authenticated: false, ...data }, { status: upstream.status });
  }

  return NextResponse.json({ authenticated: true, user: data }, { status: 200 });
}
