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

  // Login function - sets user data and cookie
  const login = (userData) => {
    // Set the user in the state
    setUser(userData);
    
    // Save to cookie
    Cookies.set(COOKIE_NAME, JSON.stringify(userData), { 
      expires: COOKIE_EXPIRY, 
      sameSite: 'Lax',
      // Use secure: true in production with HTTPS
      // secure: process.env.NODE_ENV === 'production',
    });
  };

  const register = (userData) => {
    setUser(userData);
    
  
    Cookies.set(COOKIE_NAME, JSON.stringify(userData), {
      expires: COOKIE_EXPIRY,
      sameSite: 'Lax',
      // secure: process.env.NODE_ENV === 'production',
    });
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
