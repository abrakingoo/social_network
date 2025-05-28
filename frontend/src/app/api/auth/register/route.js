import { NextResponse } from 'next/server';

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

    // Send the data to the backend API
    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify(formattedData),
    });

    console.log('API route: Backend response status:', response.status);
    
    // Get the response from the backend
    const result = await response.json();
    console.log('API route: Backend response body:', result);

    // If the response was successful, return a success message
    if (response.ok) {
      console.log('API route: Registration successful');
      
      // Create a user object from the registration data
      const user = {
        id: '1', // Backend might provide an ID, we'll use a default for now
        firstName: formattedData.first_name,
        lastName: formattedData.last_name,
        email: formattedData.email,
        nickname: formattedData.nickname || formattedData.email.split('@')[0],
        is_public: formattedData.is_public !== undefined ? formattedData.is_public : true
      };
      
      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: user,
        id: '1' // This would typically come from the backend
      }, {
        status: 200
      });
    }
    
    // If the response was not successful, forward the error from the backend
    console.log('API route: Registration failed with status', response.status);
    let errorData;
    try {
      errorData = await response.json();
      console.log('API route: Error response from backend', errorData);
    } catch (e) {
      console.log('API route: Could not parse error response from backend');
      errorData = { error: 'Failed to register user' };
    }
    
    return NextResponse.json({
      success: false,
      error: errorData.error || 'Failed to register user',
      details: errorData
    }, {
      status: response.status || 400
    });
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
