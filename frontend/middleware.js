import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  const isPublicPath = path === '/login' || path === '/register';

  // Check for session cookie instead of token
  const hasSession = request.cookies.has('session_id');

  if (path === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is not on a public path and doesn't have a session, redirect to login
  if (!isPublicPath && !hasSession) {
    // Store the original URL they were trying to access for potential redirect after login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
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
  ],
};
