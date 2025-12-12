import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/config";



export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 1. Handle Protected Routes
  // Define routes that require authentication
  const isProtectedRoute =
    pathname.startsWith("/mylands") ||
    // Removed /profile - allow guests to see login/signup buttons
    pathname.startsWith("/lands") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/chats");

  // If trying to access a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // Add the current path as a 'next' search parameter to redirect back after login
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Handle Auth Pages (Login/Signup)
  // If user is already logged in and tries to access login/signup, redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files with extension
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
