// middleware.ts (root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sl_token";

// هذه الدالة تنفّذ على كل الطلبات (الماتشر تحت)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // الداشبورد عام حسب طلبك
  const isProtected =
    pathname.startsWith("/lands") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/profile");

  const isAuthPage = pathname.startsWith("/login");

  // لو الصفحة محمية وما فيه توكن → روح للّوجين
  if (!token && isProtected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // لو معك توكن وحاولت تروح /login → رجعك للداشبورد
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// طابق كل شيء ما عدا ملفات Next الثابتة و API
export const config = {
  matcher: [
    // استبعد API وملفات الستاتك والصور والفافيكون
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
