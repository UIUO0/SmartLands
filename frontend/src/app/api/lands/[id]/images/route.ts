import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToBackend(req, `/lands/${id}/images`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Note: The backend endpoint might be different. 
  // If 405 Method Not Allowed persists, verify the backend route.
  // Common conventions: POST /lands/{id}/images or POST /lands/{id}/upload
  return forwardToBackend(req, `/lands/${id}/images`);
}
