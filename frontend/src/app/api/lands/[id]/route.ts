// src/app/api/lands/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

// ملاحظة: في Next 16, context.params صار Promise<{ id: string }>
type ParamsP = Promise<{ id: string }>;

export async function PUT(req: NextRequest, { params }: { params: ParamsP }) {
  const { id } = await params;
  const r = await forwardToBackend(req, `/lands/${id}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function DELETE(req: NextRequest, { params }: { params: ParamsP }) {
  const { id } = await params;
  const r = await forwardToBackend(req, `/lands/${id}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
