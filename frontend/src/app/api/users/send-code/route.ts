import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function POST(req: NextRequest) {
    return forwardToBackend(req, "/users/send-code", {
        method: "POST",
    });
}
