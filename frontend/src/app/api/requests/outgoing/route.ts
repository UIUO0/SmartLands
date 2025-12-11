import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function GET(req: NextRequest) {
    return forwardToBackend(req, "/requests/outgoing");
}
