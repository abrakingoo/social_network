"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { wsManager } from "@/utils/websocket";

const AuthContext = createContext();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

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
  const initializationRef = useRef(false);

  //  Centralized WebSocket management - called only when user state changes
  const manageWebSocket = (user) => {
    if (user && !wsManager.isConnected()) {
      // User authenticated and WebSocket not connected
      console.log("AuthContext: Initializing WebSocket for authenticated user");
      wsManager.setAuthState(true);
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/api/ws';
      wsManager.connect(wsUrl);
    } else if (!user && wsManager.isConnected()) {
      // User not authenticated and WebSocket is connected
      console.log("AuthContext: Cleaning up WebSocket connection");
      wsManager.setAuthState(false);
    }
  };

  //  Bulletproof checkAuth with guaranteed loading state management
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
          manageWebSocket(userObject); //  Single WebSocket management point
          return userObject;
        }
      }

      setCurrentUser(null);
      manageWebSocket(null); //  Single WebSocket management point
      return null;
    } catch (error) {
      console.error("AuthContext: Error checking authentication:", error);
      setCurrentUser(null);
      manageWebSocket(null); //  Single WebSocket management point
      return null;
    } finally {
      // CRITICAL FIX: ALWAYS set loading to false, no matter what happens
      setLoading(false);
    }
  };

  //  Initialization with StrictMode protection - WebSocket managed by checkAuth
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeAuth = async () => {
      await checkAuth(); // This handles both user state AND WebSocket management
    };

    initializeAuth();
  }, []);

  //  Login with single WebSocket initialization point
  const login = async (email, password, rememberMe) => {
    try {
      setLoading(true); // CRITICAL: Set loading true at start

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

      // CRITICAL FIX: checkAuth handles BOTH user state AND WebSocket - no duplication
      await checkAuth(); // This will set loading to false AND manage WebSocket properly

      return true;
    } catch (error) {
      // CRITICAL FIX: ALWAYS set loading to false on error
      setLoading(false);

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

  //  Logout with proper cleanup
  const logout = async () => {
    try {
      // Immediate cleanup
      setCurrentUser(null);
      setLoading(false);
      manageWebSocket(null); //  Single WebSocket management point

      // Then call API
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
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