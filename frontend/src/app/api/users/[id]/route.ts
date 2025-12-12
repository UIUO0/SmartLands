import { type NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/fetcher";

interface Params {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    return forwardToBackend(req, `/users/${id}`);
}
