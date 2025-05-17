'use client';

// This is a dummy implementation that doesn't use React Context 

// Static dummy user data
const dummyUser = {
  id: '1',
  email: 'user@example.com',
  firstName: 'Demo',
  lastName: 'User',
  avatar: '',
  isPublic: true
};

export const useAuth = () => {
  return {
    currentUser: dummyUser,
    login: () => {},
    logout: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
      }
    },
    getUserById: (id) => ({
      ...dummyUser,
      id
    }),
    getAllUsers: () => [
      { ...dummyUser, id: '2', firstName: 'Jane', lastName: 'Doe' },
      { ...dummyUser, id: '3', firstName: 'John', lastName: 'Smith' }
    ]
  };
};

export const AuthProvider = ({ children }) => {
  return children;
};
