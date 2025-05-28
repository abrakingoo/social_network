'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// Create the authentication context
const AuthContext = createContext();

// Cookie settings
const COOKIE_NAME = 'social_network_auth';
const COOKIE_EXPIRY = 7; // days

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to check if the user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if there's a cookie with authentication data
        const authCookie = Cookies.get(COOKIE_NAME);
        if (authCookie) {
          const userData = JSON.parse(authCookie);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error parsing the cookie, clear it
        Cookies.remove(COOKIE_NAME);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - authenticates with backend and sets cookie
  const login = async (credentials) => {
    try {
      console.log('AuthContext: Logging in with credentials:', { email: credentials.email });
      
      // Call backend login API through our Next.js API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Since the backend doesn't return user data, we need to create a user object
      // In a real application, we would make a separate API call to get user details
      const user = {
        id: data.id || '1', // Backend might return user ID
        firstName: credentials.first_name || '',
        lastName: credentials.last_name || '',
        email: credentials.email,
        nickname: credentials.nickname || credentials.email.split('@')[0],
        is_public: credentials.is_public !== undefined ? credentials.is_public : true
      };
      
      // Set the user in the state
      setUser(user);
      
      // Save to cookie
      Cookies.set(COOKIE_NAME, JSON.stringify(user), { 
        expires: COOKIE_EXPIRY, 
        sameSite: 'Lax',
        // Use secure: true in production with HTTPS
        // secure: process.env.NODE_ENV === 'production',
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function - registers with backend and sets cookie
  const register = async (userData) => {
    try {
      // Call backend register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Backend should return the registered user data
      // For now we'll construct a user object from the registration data
      const user = {
        id: data.id || '1', // Use ID from backend if available
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        nickname: userData.nickname || userData.email.split('@')[0],
        is_public: userData.is_public
      };
      
      // Set the user in the state
      setUser(user);
      
      // Save to cookie
      Cookies.set(COOKIE_NAME, JSON.stringify(user), {
        expires: COOKIE_EXPIRY,
        sameSite: 'Lax',
        // secure: process.env.NODE_ENV === 'production',
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function - clear user data and cookie
  const logout = () => {
    // Clear user from state
    setUser(null);
    
    Cookies.remove(COOKIE_NAME);
    
    router.push('/login');
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
