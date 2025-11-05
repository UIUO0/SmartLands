import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(req: NextRequest) {
  const r = await forwardToBackend(req, "/lands");
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  const r = await forwardToBackend(req, "/lands");
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
