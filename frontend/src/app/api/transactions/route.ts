import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(req: NextRequest) {
  const r = await forwardToBackend(req, "/transactions");
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
