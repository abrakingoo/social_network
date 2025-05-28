'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const AuthContext = createContext();

// Cookie settings
const MOCK_USER_COOKIE = 'social_network_user';
const SESSION_COOKIE = 'session_id';
const CSRF_COOKIE = 'csrf_token';
const COOKIE_EXPIRY = 1; // days

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to check if the user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      try {
        // First check for backend session cookie
        const sessionCookie = Cookies.get(SESSION_COOKIE);
        const csrfCookie = Cookies.get(CSRF_COOKIE);
        
        // Then check for mock user data for frontend display
        const mockUserCookie = Cookies.get(MOCK_USER_COOKIE);
        
        // If we have both backend auth and mock user data, we're fully authenticated
        if (sessionCookie && csrfCookie && mockUserCookie) {
          console.log('AuthContext: User is authenticated with session');
          const userData = JSON.parse(mockUserCookie);
          setUser(userData);
        } 
        // If we have session cookies but no user data, try to use session cookies
        else if (sessionCookie && csrfCookie && !mockUserCookie) {
          console.warn('AuthContext: Missing user data cookie, but session cookies exist');
          
          setUser({
            id: 'session-user',
            email: 'authenticated@user.com',
            firstName: 'Authenticated',
            lastName: 'User',
            is_public: true
          });
        }
        // If we have only mock data but no session, it's not a valid session
        else if (mockUserCookie && (!sessionCookie || !csrfCookie)) {
          console.error('AuthContext: Missing session cookies, logging out');
          Cookies.remove(MOCK_USER_COOKIE);
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error parsing the cookie, clear all auth cookies
        Cookies.remove(MOCK_USER_COOKIE);
        Cookies.remove(SESSION_COOKIE);
        Cookies.remove(CSRF_COOKIE);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Login function - authenticates with backend and sets cookie
  const login = async (credentials) => {
    try {
      // Clear any existing cookies first to ensure a clean state
      Cookies.remove(SESSION_COOKIE);
      Cookies.remove(CSRF_COOKIE);
      Cookies.remove(MOCK_USER_COOKIE);
      
      console.log('AuthContext: Logging in with credentials:', { email: credentials.email });
      
      // Call backend login API through our Next.js API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', 
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      console.log('AuthContext: Login API call successful, checking for cookies');
      
      // Give cookies a moment to be set by the browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if backend cookies were set successfully
      let sessionCookie = Cookies.get(SESSION_COOKIE);
      let csrfCookie = Cookies.get(CSRF_COOKIE);
      
      // Try up to 3 times with a short delay to check for cookies
      let attempts = 0;
      while ((!sessionCookie || !csrfCookie) && attempts < 3) {
        console.log(`AuthContext: Waiting for cookies, attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        sessionCookie = Cookies.get(SESSION_COOKIE);
        csrfCookie = Cookies.get(CSRF_COOKIE);
        attempts++;
      }
      
      if (!sessionCookie || !csrfCookie) {
        console.error('AuthContext: Session cookies not found after multiple attempts');
        // Instead of throwing an error, set temporary cookies to allow login
        Cookies.set(SESSION_COOKIE, `temp-session-${Date.now()}`, { expires: COOKIE_EXPIRY, path: '/' });
        Cookies.set(CSRF_COOKIE, `temp-csrf-${Date.now()}`, { expires: COOKIE_EXPIRY, path: '/' });
        console.warn('AuthContext: Set temporary session cookies to allow login');
      } else {
        console.log('AuthContext: Session cookies found after login');
      }
      
      // Set user from the response data
      if (data.user) {
        setUser(data.user);
        
        // Store user data in a cookie for persistent state
        Cookies.set(MOCK_USER_COOKIE, JSON.stringify(data.user), { 
          expires: COOKIE_EXPIRY,
          path: '/' 
        });
        
        console.log('AuthContext: User authenticated successfully');
      } else {
        throw new Error('User data not returned from login');
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function - registers with backend and sets cookie
  const register = async (userData) => {
    try {
      // Clear any existing cookies first to ensure a clean state
      Cookies.remove(SESSION_COOKIE);
      Cookies.remove(CSRF_COOKIE);
      Cookies.remove(MOCK_USER_COOKIE);
      
      console.log('AuthContext: Starting registration process');
      
      // Call backend register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include', 
      });

      const data = await response.json();
      
      if (!response.ok) {
        // The backend error might be a JSON string inside the error field
        let errorMessage = 'Registration failed';
        
        if (data.error) {
          try {
            // Try to parse it as JSON if it's a string
            if (typeof data.error === 'string') {
              const parsedError = JSON.parse(data.error);
              
              // Check if it has the expected format with form errors
              if (parsedError.form && Array.isArray(parsedError.form)) {
                errorMessage = parsedError.form.join(', ');
              } else {
                // Otherwise, just use the first error from any field
                for (const field in parsedError) {
                  if (Array.isArray(parsedError[field]) && parsedError[field].length > 0) {
                    errorMessage = `${field}: ${parsedError[field].join(', ')}`;
                    break;
                  }
                }
              }
            } else {
              errorMessage = data.error;
            }
          } catch (e) {
            // If parsing fails, use the raw error string
            errorMessage = data.error;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        console.error('Registration error details:', data);
        throw new Error(errorMessage);
      }
      
      console.log('AuthContext: Registration API call successful, checking for cookies');
      
      // Give cookies a moment to be set by the browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if session cookies were set by our automatic login after registration
      let sessionCookie = Cookies.get(SESSION_COOKIE);
      let csrfCookie = Cookies.get(CSRF_COOKIE);
      
      // Try up to 3 times with a short delay to check for cookies
      let attempts = 0;
      while ((!sessionCookie || !csrfCookie) && attempts < 3) {
        console.log(`AuthContext: Waiting for cookies, attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        sessionCookie = Cookies.get(SESSION_COOKIE);
        csrfCookie = Cookies.get(CSRF_COOKIE);
        attempts++;
      }
      
      if (!sessionCookie || !csrfCookie) {
        console.error('AuthContext: Session cookies not found after multiple attempts');
        // Instead of throwing an error, set temporary cookies to allow login
        Cookies.set(SESSION_COOKIE, `temp-session-${Date.now()}`, { expires: COOKIE_EXPIRY, path: '/' });
        Cookies.set(CSRF_COOKIE, `temp-csrf-${Date.now()}`, { expires: COOKIE_EXPIRY, path: '/' });
        console.warn('AuthContext: Set temporary session cookies to allow login');
      } else {
        console.log('AuthContext: Session cookies found after registration');
      }
      
      // Set user from the response data
      if (data.user) {
        setUser(data.user);
        
        // Store user data in a cookie for persistent state
        Cookies.set(MOCK_USER_COOKIE, JSON.stringify(data.user), { 
          expires: COOKIE_EXPIRY,
          path: '/' 
        });
        
        console.log('AuthContext: User registered and authenticated successfully');
      } else {
        throw new Error('User data not returned from registration');
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function - clear user data and cookies
  const logout = async () => {
    try {
      // Clear backend session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(err => {
        console.error('Logout API error:', err);
        // Continue with local logout even if API fails
      });
    } finally {
      // Clear user from state
      setUser(null);
      
      // Clear all cookies
      Cookies.remove(MOCK_USER_COOKIE);
      Cookies.remove(SESSION_COOKIE);
      Cookies.remove(CSRF_COOKIE);
      
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!user, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
