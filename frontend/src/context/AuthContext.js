'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      // Check session validity and get user data
      console.log('Checking session validity with backend...'); // Updated log
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Backend check response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Backend check successful, full data:', data); // Log the full data object
        // Access user data from nested structure
        const userData = data.message ? data.message.user : undefined; // Correctly access nested user data
        console.log('Backend check successful, user data:', userData);
        setCurrentUser(userData);
      } else {
        // Session is invalid or expired on backend
        console.log('Backend session check failed (status not OK), setting currentUser to null');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
      console.log('Authentication check finished, loading set to false');
    }
  };

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe) => {
    try {
      const credentials = btoa(`${email}:${password}`);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response:', data);

      // Set user data from the response
      if (data.message && data.message.user) {
        setCurrentUser(data.message.user);
        return true;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setCurrentUser(null);
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user by ID
  const getUserById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      return data.users;
    } catch (error) {
      console.error('Get users failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      getUserById,
      getAllUsers,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
