import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('API route: Login request received', { email: data.email });

    // Try different variations of credentials to see what works with the backend
    // Some backends expect email as username, others might expect nickname, etc.
    const variations = [
      // Variation 1: Email as username (standard format)
      { auth: Buffer.from(`${data.email}:${data.password}`).toString('base64'), desc: 'email:password' },
      
      // Variation 2: Try without whitespace
      { auth: Buffer.from(`${data.email.trim()}:${data.password.trim()}`).toString('base64'), desc: 'trimmed email:password' },
      
      // Variation 3: Try with full auth header already formatted (some libraries expect this)
      { auth: `Basic ${Buffer.from(`${data.email}:${data.password}`).toString('base64')}`, desc: 'full Basic auth header', fullHeader: true },
      
      // Variation 4: Try different case for email
      { auth: Buffer.from(`${data.email.toLowerCase()}:${data.password}`).toString('base64'), desc: 'lowercase email:password' },
    ];
    
    // Try each variation until one works
    let response = null;
    let result = null;
    let successVariation = null;
    
    for (const variation of variations) {
      console.log(`API route: Trying login with ${variation.desc}`);
      
      const headers = {
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      };
      
      // Handle whether this variation has a full header or just the encoded part
      if (variation.fullHeader) {
        headers['Authorization'] = variation.auth; // Already includes 'Basic ' prefix
      } else {
        headers['Authorization'] = `Basic ${variation.auth}`;
      }
      
      response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: headers
      });
      
      console.log('API route: Login response status:', response.status);
      
      // If this variation worked, save it and break out of the loop
      if (response.status === 200) {
        successVariation = variation;
        break;
      }
    }

    // Try to parse the response from the backend if we have one
    let responseData = null;
    try {
      if (response) {
        responseData = await response.json();
        console.log('API route: Backend login response body:', responseData);
      }
    } catch (jsonError) {
      console.log('API route: Could not parse JSON response:', jsonError.message);
      // The response might not be JSON, so we'll handle that case
      responseData = { message: 'Login response not in JSON format' };
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 500;
      const errorMessage = responseData && responseData.error ? responseData.error : 'Login failed';
      
      console.log(`API route: Login failed with status ${status}: ${errorMessage}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage
        }, 
        { status: status }
      );
    }

    console.log('API route: Login successful!');
    
    // We successfully authenticated with the backend
    // Create a user object with the available information
    const user = {
      id: responseData && responseData.id ? responseData.id : '1',
      email: data.email,
      firstName: responseData && responseData.first_name ? responseData.first_name : '',
      lastName: responseData && responseData.last_name ? responseData.last_name : '',
      nickname: data.email.split('@')[0], // Use email as a basic identifier
      is_public: true
    };

    // For additional info on which variation worked
    if (successVariation) {
      console.log(`API route: Successful login using ${successVariation.desc} format`);
    }

    // Return a success response with the user info
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: user
      }, 
      { status: 200 }
    );
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
