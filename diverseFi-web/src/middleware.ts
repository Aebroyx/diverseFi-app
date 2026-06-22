import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register'];

// List of auth routes that should redirect to home if user is authenticated
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user has an access token cookie
  const hasAccessToken = request.cookies.has('access_token');
  
  // If trying to access auth routes while logged in, redirect to home
  if (authRoutes.includes(pathname) && hasAccessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access protected routes while logged out, redirect to login
  if (!publicRoutes.includes(pathname) && !hasAccessToken) {
    // Store the original URL to redirect back after login
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
      /*
       * Match all request paths except:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - Static files (images, etc.)
       */
      '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
  };