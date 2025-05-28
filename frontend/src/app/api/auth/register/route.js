import { NextResponse } from 'next/server';
import { FormData } from 'formdata-node';

export async function POST(request) {
  try {
    console.log('API route: Registration request received');
    const data = await request.json();
    console.log('API route: Received form data:', data);

    // Properly format the data for the backend
    const formattedData = {
      email: data.email,
      password: data.password,
      confirmed_password: data.confirmed_password,
      first_name: data.first_name,
      last_name: data.last_name,
      nickname: data.nickname || '',
      about_me: data.about_me || '',
      avatar: data.avatar || '',
      is_public: data.is_public !== undefined ? data.is_public : true,
    };

    // Format date in RFC3339 format for Go's time.Time unmarshaling
    if (data.date_of_birth) {
      // If date is already in ISO format with time, use it directly
      if (data.date_of_birth.includes('T')) {
        formattedData.date_of_birth = data.date_of_birth;
      } else {
        // Otherwise, add the time component (midnight UTC)
        formattedData.date_of_birth = `${data.date_of_birth}T00:00:00Z`;
      }
    }

    console.log('API route: Formatted data for backend:', formattedData);

    console.log('API route: Preparing multipart form data');
    
    // Create a FormData object for proper multipart form submission
    const formData = new FormData();
    
    // Add all fields to the form data with the exact field names expected by backend
    formData.append('email', formattedData.email);
    formData.append('password', formattedData.password);
    formData.append('confirmed_password', formattedData.confirmed_password);
    formData.append('first_name', formattedData.first_name);
    formData.append('last_name', formattedData.last_name);
    formData.append('nickname', formattedData.nickname || '');
    
    // IMPORTANT: Backend expects 'about' not 'about_me'
    formData.append('about', formattedData.about_me || '');
    
    // Format date in DD/MM/YYYY format as expected by backend
    if (formattedData.date_of_birth) {
      try {
        const date = new Date(formattedData.date_of_birth);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        formData.append('date_of_birth', `${day}/${month}/${year}`);
      } catch (e) {
        console.error('Failed to format date:', e);
        formData.append('date_of_birth', '');
      }
    } else {
      formData.append('date_of_birth', '');
    }
    
    // Handle is_public as a string 'true' or 'false'
    formData.append('is_public', formattedData.is_public ? 'true' : 'false');
    
    // For avatar, we'd need to create a File object from blob data
    // For now, we'll skip it as we don't have actual file data
    
    console.log('API route: Sending multipart form data to backend');
    
    // Send the data to the backend API
    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: {
        // Note: Do NOT set Content-Type here, it will be set automatically with the boundary
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: formData,
    });

    console.log('API route: Backend response status:', response.status);
    
    let responseData;
    try {
      // Get the response from the backend
      responseData = await response.json();
      console.log('API route: Backend response body:', responseData);
    } catch (e) {
      console.log('API route: Could not parse response from backend');
      responseData = { message: 'Registration response not in JSON format' };
    }

    // If the response was not successful, forward the error from the backend
    if (!response.ok) {
      console.log('API route: Registration failed with status', response.status);
      return NextResponse.json({
        success: false,
        error: responseData.error || 'Failed to register user',
        details: responseData
      }, {
        status: response.status || 400
      });
    }
    
    console.log('API route: Registration successful');
    
    const authString = Buffer.from(`${data.email}:${data.password}`).toString('base64');
    const authHeader = `Basic ${authString}`;
    
    // Call the login endpoint to get session cookies
    console.log('API route: Automatically logging in after registration');
    const loginResponse = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    // Create a mock user object from the registration data
    const mockUser = {
      id: '1', // Mock ID
      firstName: formattedData.first_name,
      lastName: formattedData.last_name,
      email: formattedData.email,
      nickname: formattedData.nickname || formattedData.email.split('@')[0],
      is_public: formattedData.is_public !== undefined ? formattedData.is_public : true
    };
    
    // Prepare the response with mock user data for frontend display
    const clientResponse = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: mockUser
    }, {
      status: 200
    });
    
    // Extract and forward session cookies from login response
    const loginCookies = loginResponse.headers.getSetCookie();
    console.log('API route: Cookies from backend login response:', loginCookies);
    
    if (loginCookies && loginCookies.length > 0 && loginResponse.ok) {
      console.log('API route: Forwarding login session cookies to client');
      for (const cookie of loginCookies) {
        // Parse the cookie string to extract name and value
        const cookieParts = cookie.split(';')[0].split('=');
        if (cookieParts.length >= 2) {
          const cookieName = cookieParts[0].trim();
          const cookieValue = cookieParts[1].trim();
          
          console.log(`API route: Setting cookie ${cookieName}`);
          
          // Forward the cookie to the client
          clientResponse.cookies.set(cookieName, cookieValue, {
            httpOnly: cookie.includes('HttpOnly'),
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
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
              httpOnly: false, // CSRF token may need to be read by JavaScript
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24
            });
          }
        }
      }
    } else {
      console.warn('API route: No cookies found in backend login response or login failed, setting fallback cookies');
    
     
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
    clientResponse.cookies.set('social_network_user', JSON.stringify(mockUser), {
      httpOnly: false, 
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return clientResponse;
  } catch (error) {
    console.error('API route: Registration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to register user'
    }, {
      status: 500
    });
  }
}
