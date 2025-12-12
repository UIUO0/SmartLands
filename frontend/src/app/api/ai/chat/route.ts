import { type NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

export async function POST(req: NextRequest) {
    return forwardToBackend(req, "/ai/chat");
}
