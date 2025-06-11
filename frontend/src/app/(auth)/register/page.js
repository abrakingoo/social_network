'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import RegisterForm from '@/components/auth/RegisterForm';

const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-');
      return `${day}/${month}/${year}`;
    }
  }
  if (dateValue instanceof Date) {
    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const year = dateValue.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return '';
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [backendErrors, setBackendErrors] = useState({});
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

  const handleClearBackendErrors = (fieldName) => {
    setBackendErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleRegister = async (formData) => {
    setIsLoading(true);
    setBackendErrors({});

    try {
      const backendFormData = {
        email: formData.email,
        password: formData.password,
        confirmed_password: formData.confirmed_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formatDateForInput(formData.date_of_birth),
        avatar: formData.avatar,
        nickname: formData.nickname || formData.email.split('@')[0],
        about_me: formData.about || '',
        is_public: formData.is_public
      };

      const multipartFormData = new FormData();
      Object.entries(backendFormData).forEach(([key, value]) => {
        if (key === 'avatar' && value instanceof File) {
          multipartFormData.append('avatar', value);
        } else if (key === 'avatar' && typeof value === 'string') {
          multipartFormData.append('avatar_url', value);
        } else if (key === 'about_me') {
          multipartFormData.append('about', value);
        } else {
          multipartFormData.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        credentials: 'include',
        body: multipartFormData,
      });

      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 406) {
          // Parse validation errors from backend
          try {
            const validationErrors = JSON.parse(responseText);
            setBackendErrors(validationErrors);
            throw new Error('Please fix the form errors below');
          } catch (parseError) {
            throw new Error(responseText || 'Validation failed');
          }
        } else if (response.status === 500) {
          // Handle server errors (like duplicate email)
          if (responseText.includes('Failed to register user')) {
            // Most likely a duplicate email error
            setBackendErrors({ email: 'This email is already registered. Please login if you have an account.' });
            throw new Error('Email already exists');
          } else {
            throw new Error(responseText || 'Server error occurred');
          }
        } else {
          throw new Error(responseText || 'Registration failed');
        }
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });

      sessionStorage.setItem('lastRegisteredEmail', backendFormData.email);
      router.push('/login');

    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message,
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
      </div>

      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        backendErrors={backendErrors}
        onClearBackendErrors={handleClearBackendErrors}
      />

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