import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function POST(req: NextRequest) {
    // Use a longer timeout for file uploads if needed, or default
    return forwardToBackend(req, "/users/me/profile-picture", {
        method: "POST",
        // forwardToBackend handles sending the FormData correctly
    });
}
