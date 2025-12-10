import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/lands/requests/${id}/reject`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
  });

  if (!res.ok) return NextResponse.json({ message: "Error" }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}