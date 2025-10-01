import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Paths that require authentication
  const isAdminPath = path.startsWith('/admin') && path !== '/admin/login';
  const isAdminAPIPath = path.startsWith('/api/admin') && path !== '/api/admin/auth';

  // Check if user is authenticated
  const sessionCookie = request.cookies.get('admin_session');
  const isAuthenticated = sessionCookie?.value === 'authenticated';

  // Redirect to login if accessing protected admin page without auth
  if (isAdminPath && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  // Return 401 for unauthenticated admin API requests
  if (isAdminAPIPath && !isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};