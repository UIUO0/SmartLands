// middleware.ts (في جذر المشروع)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sl_token";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const path = req.nextUrl.pathname;

  // صفحات تتطلب تسجيل الدخول (اترك dashboard عام)
  const isProtected =
    path.startsWith("/lands") ||
    path.startsWith("/requests") ||
    path.startsWith("/transactions") ||
    path.startsWith("/assistant") ||
    path.startsWith("/profile"); // لو تبغى صفحة بروفايل مستقبلًا

  const isAuthPage = path.startsWith("/login");

  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/lands/:path*",
    "/requests/:path*",
    "/transactions/:path*",
    "/assistant/:path*",
    "/profile/:path*", // اختياري
  ],
};
