import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToBackend(req, `/lands/${id}/images`);
}

// Keep as is for now, will probe backend
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Forward to backend - trying /upload as /images returned 405
  return forwardToBackend(req, `/lands/${id}/upload`);
}
