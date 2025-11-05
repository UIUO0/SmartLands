// src/lib/fetcher.ts
import type { NextRequest } from "next/server";
import { API_URL, COOKIE_NAME } from "./config";

/**
 * Forwards the incoming Next.js Route Handler request to the FastAPI backend.
 * - Reads JWT from req.cookies (COOKIE_NAME)
 * - Copies method/headers/body
 * - Adds Authorization: Bearer <token> when available
 * - Disables caching
 */
export async function forwardToBackend(
  req: NextRequest,
  path: string,
  initOverrides?: RequestInit
) {
  const backend = API_URL.replace(/\/+$/, "");
  const rel = path.replace(/^\/+/, "");
  const url = `${backend}/${rel}`;

  // خذ التوكن من الكوكيز حق نفس الطلب (أضمن من cookies())
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // انسخ الهيدرز وخلّها قابلة للتعديل
  const headers = new Headers(req.headers);

  // ضف الهيدر حق التوثيق إذا فيه توكن
  if (token) headers.set("authorization", `Bearer ${token}`);

  // تأكد من الـ content-type إذا كان موجود بالأصل
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  // جهّز الجسم (GET/HEAD ما لها body)
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.clone().arrayBuffer();

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
    cache: "no-store",
    ...initOverrides,
  };

  return fetch(url, init);
}
