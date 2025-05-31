import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register';
  const isRootPath = path === '/';

  // Check for session cookie
  const hasSession = request.cookies.has('session_id');

  // If user has a session and tries to access public paths, redirect to home
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user doesn't have a session and tries to access protected paths
  if (!hasSession && !isPublicPath) {
    // For root path, redirect to login without callback URL to prevent redirect loops
    if (isRootPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For other protected paths, include callback URL
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/profile/:path*',
    '/messages/:path*',
    '/friends/:path*',
    '/events/:path*',
    '/groups/:path*',
    '/settings/:path*',
    '/photos/:path*',
  ],
};
