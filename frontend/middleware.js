import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  const isPublicPath = path === '/login' || path === '/register';
  
  // Get the token from cookies
  const token = request.cookies.get('social_network_auth')?.value;
  const isAuthenticated = !!token;


  if (!isAuthenticated && !isPublicPath) {
    const url = new URL('/login', request.url);
    // Add cache control headers to prevent caching of redirects
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  }

  if (isAuthenticated && isPublicPath) {
    const url = new URL('/', request.url);
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
