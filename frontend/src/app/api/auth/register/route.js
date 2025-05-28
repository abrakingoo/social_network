import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('API route: Registration request received');
    const data = await request.json();
    console.log('API route: Received form data:', data);

    
    // Convert date to the right format (yyyy-MM-dd) if it's in ISO format
    let dateOfBirth = data.date_of_birth;
    if (dateOfBirth && dateOfBirth.includes('T')) {
      // If it's an ISO date string, convert to yyyy-MM-dd
      dateOfBirth = dateOfBirth.split('T')[0];
      console.log('API route: Converted date to:', dateOfBirth);
    }
    
    const formattedData = {
      email: data.email,
      password: data.password,
      confirmed_password: data.confirmed_password,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: dateOfBirth,
      nickname: data.nickname || '',
      about_me: data.about || '',
      is_public: data.is_public !== undefined ? data.is_public : true,
      avatar: '' // We can't easily send files through this API, so skip avatar for now
    };

    console.log('API route: Formatted data for backend:', formattedData);
    console.log('API route: Sending request to backend at http://localhost:8000/api/register');

    // Convert YYYY-MM-DD to RFC3339 format (YYYY-MM-DDT00:00:00Z)
    if (formattedData.date_of_birth) {
      formattedData.date_of_birth = `${formattedData.date_of_birth}T00:00:00Z`;
    }
    
    console.log('API route: Final data with formatted date:', formattedData);
    
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

    // Return the response to the client
    return NextResponse.json(
      { 
        success: response.ok, 
        message: result.message,
        data: response.ok ? formattedData : null,
        error: response.ok ? null : result.message 
      }, 
      { status: response.status }
    );
  } catch (error) {
    console.error('API route: Registration error:', error);
    
    // Return a generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to register user',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
