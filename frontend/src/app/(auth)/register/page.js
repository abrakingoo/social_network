'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import RegisterForm from '@/components/auth/RegisterForm';

// Helper function to ensure date is in yyyy-MM-dd format
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') {
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    // If it's ISO format, extract date part
    return dateValue.split('T')[0];
  }
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  return '';
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (formData) => {
    setIsLoading(true);

    try {
      // Step 1: Add detailed console logging
      console.log('Registering with original data:', formData);

      // Step 2: Transform frontend data to match backend expectations
      const backendFormData = {
        email: formData.email,
        password: formData.password,
        confirmed_password: formData.confirmed_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formatDateForInput(formData.date_of_birth), // Use helper function
        avatar: formData.avatar,
        nickname: formData.nickname || formData.email.split('@')[0],
        about_me: formData.about || '',
        is_public: formData.is_public
      };

      console.log('Sending to backend:', JSON.stringify(backendFormData));

      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(backendFormData),
      });

      if (!response.ok) {
        console.log('Registration error status:', response.status);
        const errorText = await response.text();
        console.log('Registration error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Registration failed' };
        }
        throw new Error(errorData.error || 'Registration failed');
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });

      // Store the email to make login easier
      sessionStorage.setItem('lastRegisteredEmail', formData.email);

      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-gray-500 mt-2">Enter your information to register</p>
      </div>

      <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />

      <div className="text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}