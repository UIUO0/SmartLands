// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sl_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // صفحات محمية فقط (dashboard عام)
  const isProtected =
    pathname.startsWith("/lands") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/profile");

  const isAuthPage = pathname.startsWith("/login");

  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// استبعد /api وملفات الستاتك
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
