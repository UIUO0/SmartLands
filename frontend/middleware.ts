// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/config";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const path = req.nextUrl.pathname;

  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedPage =
    path.startsWith("/dashboard") ||
    path.startsWith("/lands") ||
    path.startsWith("/requests") ||
    path.startsWith("/transactions") ||
    path.startsWith("/assistant");

  if (!token && isProtectedPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${path}`;
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
    "/signup",
    "/dashboard/:path*",
    "/lands/:path*",
    "/requests/:path*",
    "/transactions/:path*",
    "/assistant/:path*",
  ],
};
