import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Redirect legacy uppercase paths to the canonical lowercase route
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (url.pathname === "/Profile" || url.pathname.startsWith("/Profile/")) {
    url.pathname = url.pathname.replace(/^\/Profile/, "/profile");
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/Profile", "/Profile/:path*"],
};
