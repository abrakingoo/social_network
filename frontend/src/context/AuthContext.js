'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Fetch user data with the token
      const response = await fetch('http://localhost:8000/api/getPosts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('logged in')
        setCurrentUser(userData);
      } else {
        // Token is invalid
        sessionStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
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
      
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      // Store token in both cookie and sessionStorage
      document.cookie = `token=${data.token};path=/;max-age=${rememberMe ? 604800 : 86400}`; // 7 days or 1 day
      sessionStorage.setItem('token', data.token);
      
      // Fetch user data
      await checkAuth();
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setCurrentUser(null);
  };

  // Get user by ID
  const getUserById = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`http://localhost:8000/api/user/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get users failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    getUserById,
    getAllUsers,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
