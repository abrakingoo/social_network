
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/sonner";

export const AuthContext = createContext();

// Mock user data - this would typically come from your backend
const MOCK_USERS = [
  {
    id: '1',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    dateOfBirth: '1990-01-01',
    nickname: 'Johnny',
    about: 'Software developer and outdoor enthusiast',
    isPublic: true,
    followers: ['2'],
    following: [],
    posts: ['1', '2']
  },
  {
    id: '2',
    email: 'jane@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    dateOfBirth: '1992-05-15',
    nickname: 'Janey',
    about: 'Digital artist and coffee addict',
    isPublic: false,
    followers: [],
    following: ['1'],
    posts: ['3']
  }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState(MOCK_USERS);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback((email, password, rememberMe) => {
    // Find user with matching email and password
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Remove password from stored user object
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      
      // Store in localStorage if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      }
      
      toast.success("Successfully logged in!");
      return true;
    } else {
      toast.error("Invalid email or password");
      return false;
    }
  }, [users]);

  // Register function
  const register = useCallback((userData) => {
    // Check if email already exists
    if (users.some(user => user.email === userData.email)) {
      toast.error("Email already in use");
      return false;
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      followers: [],
      following: [],
      posts: []
    };
    
    // Add to users array
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    // Log user in
    const { password, ...userWithoutPassword } = newUser;
    setCurrentUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    toast.success("Account created successfully!");
    return true;
  }, [users]);

  // Logout function
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast.success("Successfully logged out");
  }, []);

  // Toggle profile visibility
  const toggleProfileVisibility = useCallback(() => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, isPublic: !currentUser.isPublic };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update in users array
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? { ...user, isPublic: !user.isPublic } : user
      )
    );
    
    toast.success(`Profile visibility set to ${updatedUser.isPublic ? 'public' : 'private'}`);
  }, [currentUser]);
  
  const getAllUsers = useCallback(() => {
    return users.map(({ password, ...user }) => user);
  }, [users]);

  const getUserById = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }, [users]);

  // Update user profile
  const updateUserProfile = useCallback((profileData) => {
    if (!currentUser) return false;
    
    const updatedUser = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update in users array
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? { ...user, ...profileData } : user
      )
    );
    
    toast.success("Profile updated successfully");
    return true;
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    toggleProfileVisibility,
    getAllUsers,
    getUserById,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
