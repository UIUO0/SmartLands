// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sl_token";

// صفحات عامة بشكل صريح
const PUBLIC_PATHS = new Set<string>(["/", "/dashboard", "/login"]);

// مسارات نحتاج نتجاهلها دومًا (ستايل/صور…)
function isStaticOrSystem(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // لا تلمس الـ API ولا الملفات الثابتة
  if (pathname.startsWith("/api") || isStaticOrSystem(pathname)) {
    return NextResponse.next();
  }

  // مرّر الصفحات العامة دائمًا
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // الصفحات المحمية (أي شيء غير العامة التالية)
  const isProtected =
    pathname.startsWith("/lands") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/profile");

  // لو محمية وما عندك توكن → إلى /login
  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // لو عندك توكن ودخلت /login → رجّعك للداشبورد
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// نطابق كل شيء (نستثني API والستايتك داخل الكود نفسه)
export const config = {
  matcher: ["/:path*"],
};
