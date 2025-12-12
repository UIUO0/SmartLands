import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function POST(req: NextRequest) {
    return forwardToBackend(req, "/auth/reset-password/confirm", {
        method: "POST",
    });
}
