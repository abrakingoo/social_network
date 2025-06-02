'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData) => {
    setIsLoading(true);

    try {
      await login(formData.email, formData.password, formData.rememberMe);

      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });

      router.push('/');
    } catch (error) {
      // AuthError objects have structured properties
      if (error.type === 'validation' || error.type === 'rate_limit') {
        // Let the form handle these validation errors
        throw error;
      } else {
        // Show system errors as toast
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
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