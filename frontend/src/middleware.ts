import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_NAME } from '@/lib/config'

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // قائمة المسارات المحمية (التي تتطلب تسجيل دخول)
  // لا تضع /api/users/me هنا، دع الراوت نفسه يتعامل معها
  const protectedRoutes = ['/dashboard', '/mylands', '/profile'];

  // إذا كان المستخدم يحاول دخول صفحة محمية وهو غير مسجل
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        // loginUrl.searchParams.set('from', pathname); // اختياري: للعودة للصفحة السابقة
        return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// تحديد المسارات التي يعمل عليها الميدل وير
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}