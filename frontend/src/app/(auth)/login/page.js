'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData) => {
    setIsLoading(true);

    try {
      const credentials = btoa(`${formData.email}:${formData.password}`);


      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      })

      if (!response.ok) {
        console.log(response);
        throw new Error($`Failed to login: ${response.error}`);
      }
      
      const data = await response.json();
      sessionStorage.setItem('token', data.token);

      router.push('/');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
