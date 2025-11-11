// middleware.ts (root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sl_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // الداشبورد عام
  const isProtected =
    pathname.startsWith("/lands") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/profile");

  const isAuthPage = pathname.startsWith("/login");

  // مو مسجّل وتحاول صفحة محمية → روح للّوجين
  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // معك توكن وتحاول /login → رجّعك للداشبورد
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// طابق فقط الصفحات، واستبعد الـ API وملفات البناء
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
