'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmed_password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nickname: '',
    about: '',
    is_public: true
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      let { email, password, confirmed_password, first_name, last_name, date_of_birth } = formData;

      // Validate required fields
      if (!email || !password || !confirmed_password || !first_name || !last_name || !date_of_birth) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password strength
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and numbers');
      }

      // Check if passwords match
      if (password !== confirmed_password) {
        throw new Error('Passwords do not match');
      }

      // Check age (must be at least 13)
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      

      if (age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }

      // Call the provided onSubmit handler
      if (onSubmit) {
        // Add default avatar if none provided
        if (!formData.avatar) {
          formData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(first_name + ' ' + last_name)}&background=random`;
        }

        formData.date_of_birth = birthDate.toISOString();

        onSubmit(formData);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <p className="text-xs text-gray-500">
          Password must be at least 8 characters and include uppercase, lowercase, and numbers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmed_password">Confirm Password <span className="text-red-500">*</span></Label>
        <Input
          id="confirmed_password"
          name="confirmed_password"
          type="password"
          value={formData.confirmed_password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
        <Input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname (Optional)</Label>
        <Input
          id="nickname"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">About Me (Optional)</Label>
        <Input
          id="about"
          name="about"
          value={formData.about}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};

export default RegisterForm;
