"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

// Custom error class for authentication
class AuthError extends Error {
  constructor(message, type = "general", field = null, status = null) {
    super(message);
    this.name = "AuthError";
    this.type = type;
    this.field = field;
    this.status = status;
  }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userObject =
          data.user ||
          data.profile ||
          data.account ||
          data.data ||
          data.message ||
          data;
        if (
          typeof userObject === "object" &&
          userObject !== null &&
          Object.keys(userObject).length > 0
        ) {
          setCurrentUser(userObject);
        } else {
          // If after all checks, userObject is not a valid object or is empty, log an error and set to null
          console.error(
            "AuthContext: Failed to extract a valid user object from /api/profile response or user object is empty. Response data:",
            data,
          );
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function with structured error handling
  const login = async (email, password, rememberMe) => {
    try {
      const credentials = btoa(`${email}:${password}`);

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${credentials}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        switch (response.status) {
          case 401:
            throw new AuthError(
              "Invalid email/nickname or password",
              "validation",
              "credentials",
              401,
            );
          case 500:
            throw new AuthError(
              "Server error. Please try again later.",
              "server",
              null,
              500,
            );
          case 429:
            throw new AuthError(
              "Too many login attempts. Please wait and try again.",
              "rate_limit",
              null,
              429,
            );
          default:
            throw new AuthError(
              errorData.error || "Login failed. Please try again.",
              "general",
              null,
              response.status,
            );
        }
      }

      await checkAuth();
      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      } else {
        console.error("Unexpected login error:", error);
        throw new AuthError(
          "Network error. Please check your connection.",
          "network",
        );
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user by ID
  const getUserById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      return data.users;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        getUserById,
        getAllUsers,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
