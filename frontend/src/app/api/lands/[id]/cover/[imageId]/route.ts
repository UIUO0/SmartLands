import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    const { id, imageId } = await params;
    return forwardToBackend(req, `/lands/${id}/cover/${imageId}`);
}
