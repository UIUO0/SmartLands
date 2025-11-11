import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(req: NextRequest) {
  // يرسل /lands مع كل الاستعلامات كما هي (مثال: ?status=available&city=Riyadh&q=...)
  const r = await forwardToBackend(req, `/lands${req.nextUrl.search}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  // (للاستخدام لاحقاً)
  const r = await forwardToBackend(req, "/lands");
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
