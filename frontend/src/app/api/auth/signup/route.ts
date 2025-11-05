// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
