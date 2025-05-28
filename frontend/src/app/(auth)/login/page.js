'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData) => {
    setIsLoading(true);

    try {
      // For now, we'll use mock authentication
      // In a real application, you'd validate credentials with the backend
      
      // Create a mock user based on login details
      const userData = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: formData.email,
        avatar: '', // No avatar during login - would come from backend in real app
        nickname: formData.email.split('@')[0] || 'user',
        date_of_birth: '1990-01-01',
        about_me: 'This is a mock user profile',
        is_public: true
      };
      
      // Use the login function from AuthContext to set user data and cookies
      login(userData);
      
      // Show success message
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });

      // Redirect to home page
      router.push('/');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Login failed',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white rounded-lg p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-gray-500 mt-2">Welcome back! Please login to your account</p>
      </div>

      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

      <div className="text-center text-sm">
        <p>
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

