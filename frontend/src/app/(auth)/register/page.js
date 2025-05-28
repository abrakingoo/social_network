'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (formData) => {
    setIsLoading(true);
  
    try {
      // Format the data for the backend
      const apiFormData = {
        email: formData.email,
        password: formData.password,
        confirmed_password: formData.confirmed_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        nickname: formData.nickname || '',
        about_me: formData.about || '',
        is_public: formData.is_public !== undefined ? formData.is_public : true
      };
      
      // Handle avatar file if present
      if (formData.avatar && formData.avatar instanceof File) {
        // In a real implementation, you'd upload the avatar file to the backend
        // For now we'll skip actual file upload since it requires additional server-side handling
        console.log('Avatar file present, would need to be uploaded separately:', formData.avatar.name);
      }
      
      console.log('Registering with data:', apiFormData);
      
      // Use the register function from AuthContext to register with the backend
      const result = await register(apiFormData);
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully"
      });
      
      // Redirect to the home page
      router.push('/');
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
    <div className="w-full max-w-md space-y-6 bg-white rounded-lg p-6">
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
