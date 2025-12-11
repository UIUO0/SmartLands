import { API_URL } from "./config"


export function getAbsoluteImageUrl(path: string | null | undefined): string {
    if (!path) return "/placeholder.svg";

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // Clean up path and API_URL ensuring single slash
    const baseUrl = API_URL.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
