import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await forwardToBackend(req, `/lands/${params.id}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await forwardToBackend(req, `/lands/${params.id}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
