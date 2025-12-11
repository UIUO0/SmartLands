import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Backend expects: POST /lands/requests/{request_id}/accept
  return forwardToBackend(req, `/lands/requests/${id}/accept`);
}