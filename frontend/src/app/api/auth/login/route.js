import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('API route: Login request received', { email: data.email });

    // Prepare authorization header with Basic Auth
    const authString = Buffer.from(`${data.email}:${data.password}`).toString('base64');
    const authHeader = `Basic ${authString}`;

    // Send the credentials to the backend
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('API route: Login response status:', response.status);

    // Try to parse the response from the backend
    let responseData = null;
    try {
      responseData = await response.json();
      console.log('API route: Backend login response body:', responseData);
    } catch (jsonError) {
      console.log('API route: Could not parse JSON response:', jsonError.message);
      responseData = { message: 'Login response not in JSON format' };
    }

    if (!response.ok) {
      const status = response.status;
      const errorMessage = responseData && responseData.error ? responseData.error : 'Login failed';
      
      console.log(`API route: Login failed with status ${status}: ${errorMessage}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage
        }, 
        { status }
      );
    }

    console.log('API route: Login successful!');
    
    // Extract cookies from the backend response and forward them to the client
    const responseCookies = response.headers.getSetCookie();
    console.log('API route: Cookies from backend:', responseCookies);
    
    // Create a NextResponse object
    const clientResponse = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        // Still provide mock user data for display on the frontend
        user: {
          id: '1', // Mock ID for now
          email: data.email,
          firstName: data.first_name || data.email.split('@')[0],
          lastName: data.last_name || '',
          nickname: data.nickname || data.email.split('@')[0],
          is_public: true
        }
      }, 
      { status: 200 }
    );
    
    // Forward the session cookies from backend to frontend
    if (responseCookies && responseCookies.length > 0) {
      console.log('API route: Found cookies in backend response, forwarding to client');
      for (const cookie of responseCookies) {
        // Parse the cookie string to extract name and value
        const cookieParts = cookie.split(';')[0].split('=');
        if (cookieParts.length >= 2) {
          const cookieName = cookieParts[0].trim();
          const cookieValue = cookieParts[1].trim();
          
          console.log(`API route: Setting cookie ${cookieName}`);
          
          // Forward the cookie to the client
          clientResponse.cookies.set(cookieName, cookieValue, {
            httpOnly: cookie.includes('HttpOnly'),
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            sameSite: 'lax', // Changed to lax to ensure cookies work across domains in development
            path: '/',
            // Set for 24 hours matching backend
            maxAge: 60 * 60 * 24
          });
          
          // Explicitly set our expected cookies for AuthContext validation
          if (cookieName === 'session_id' || cookieName.includes('session')) {
            clientResponse.cookies.set('session_id', cookieValue, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24
            });
          }
          
          if (cookieName === 'csrf_token' || cookieName.includes('csrf')) {
            clientResponse.cookies.set('csrf_token', cookieValue, {
              httpOnly: false, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24
            });
          }
        }
      }
    } else {
      console.warn('API route: No cookies found in backend response, setting fallback cookies');
      
      // Set fallback cookies if the backend doesn't provide them
      // Note: This is a temporary solution and should be removed once backend is properly setting cookies
      clientResponse.cookies.set('session_id', `session_${Date.now()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });
      
      clientResponse.cookies.set('csrf_token', `csrf_${Date.now()}`, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });
    }

    // Create a cookie with mock user data for frontend display
    // This cookie is specifically for rendering mock data on the frontend
    clientResponse.cookies.set('social_network_user', JSON.stringify({
      id: '1',
      email: data.email,
      firstName: data.first_name || data.email.split('@')[0],
      lastName: data.last_name || '',
      nickname: data.nickname || data.email.split('@')[0],
      is_public: true
    }), {
      httpOnly: false, // Allow frontend JavaScript to access
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return clientResponse;
  } catch (error) {
    console.error('API route: Login error:', error);
    
    // Return a generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to login',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
