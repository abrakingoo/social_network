"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { wsManager } from "@/utils/websocket";
import userService from "@/services/userService";

const AuthContext = createContext();

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Transform backend user data to frontend format
const transformUserData = (backendUser) => {
  if (!backendUser) return null;

  return {
    ...backendUser,
    firstName: backendUser.first_name || backendUser.firstName,
    lastName: backendUser.last_name || backendUser.lastName,
    dateOfBirth: backendUser.date_of_birth || backendUser.dateOfBirth,
    aboutMe: backendUser.about_me || backendUser.aboutMe,
    isPublic:
      backendUser.is_public !== undefined
        ? backendUser.is_public
        : backendUser.isPublic,
    createdAt: backendUser.created_at || backendUser.createdAt,
  };
};

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
      wsManager.setAuthState(true);
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/api/ws";
      wsManager.connect(wsUrl);
    } else if (!user && wsManager.isConnected()) {
      // User not authenticated and WebSocket is connected
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
          const transformedUser = transformUserData(userObject);
          setCurrentUser(transformedUser);
          manageWebSocket(transformedUser); // Single WebSocket management point
          return transformedUser;
        }
      }

      setCurrentUser(null);
      manageWebSocket(null); // Single WebSocket management point
      return null;
    } catch (error) {
      console.error("AuthContext: Error checking authentication:", error);
      setCurrentUser(null);
      manageWebSocket(null); // Single WebSocket management point
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
      manageWebSocket(null); // Single WebSocket management point

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
      return transformUserData(data.user);
    } catch (error) {
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    if (currentUser) {
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
        return data.users.map(transformUserData);
      } catch (error) {
        throw error;
      }
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      // Transform frontend field names to backend field names
      const backendData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        nickname: userData.nickname,
        about_me: userData.about,
        is_public: userData.isPublic,
        date_of_birth: userData.dateOfBirth,
      };

      // Remove undefined values
      const filteredData = Object.fromEntries(
        Object.entries(backendData).filter(([_, value]) => value !== undefined),
      );

      const result = await userService.updateUser(filteredData);

      // Refresh the current user data
      await checkAuth();

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
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
        updateUser,
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
