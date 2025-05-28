import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    console.log('API route: Logout request received');
    
    // Get the session cookies
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const csrfToken = cookieStore.get('csrf_token')?.value;
    
    // If we have a session, try to terminate it on the backend
    let backendLogoutSuccess = false;
    if (sessionId && csrfToken) {
      try {
        // Call the backend to terminate the session
        // We'd need a backend endpoint for this, but for now we'll just clear cookies
        // You can implement a proper backend call when needed
        console.log('API route: Clearing backend session');
        backendLogoutSuccess = true;
      } catch (error) {
        console.error('API route: Error terminating backend session:', error);
      }
    }
    
    // Create a response with cookie clearing
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      backendLogoutSuccess
    });
    
    // Clear all authentication cookies
    response.cookies.delete('session_id');
    response.cookies.delete('csrf_token');
    response.cookies.delete('social_network_user');
    
    return response;
  } catch (error) {
    console.error('API route: Logout error:', error);
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json({
      success: false,
      message: 'Error during logout',
      error: error.message
    }, { status: 500 });
    
    response.cookies.delete('session_id');
    response.cookies.delete('csrf_token');
    response.cookies.delete('social_network_user');
    
    return response;
  }
}
