'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterForm = ({ onSubmit, isLoading }) => {
  const [maxDate, setMaxDate] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmed_password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nickname: '',
    about: '',
    is_public: true,
    avatar: null
  });
  
  // Set max date to today's date when component mounts
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setMaxDate(`${year}-${month}-${day}`);
  }, []);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const newFieldErrors = {};
    let hasErrors = false;

    try {
      let { email, password, confirmed_password, first_name, last_name, date_of_birth } = formData;

      // Validate required fields with specific error messages
      if (!first_name) {
        newFieldErrors.first_name = 'First name is required';
        hasErrors = true;
      }
      
      if (!last_name) {
        newFieldErrors.last_name = 'Last name is required';
        hasErrors = true;
      }
      
      if (!email) {
        newFieldErrors.email = 'Email is required';
        hasErrors = true;
      }
      
      if (!password) {
        newFieldErrors.password = 'Password is required';
        hasErrors = true;
      }
      
      if (!confirmed_password) {
        newFieldErrors.confirmed_password = 'Please confirm your password';
        hasErrors = true;
      }
      
      if (!date_of_birth) {
        newFieldErrors.date_of_birth = 'Date of birth is required';
        hasErrors = true;
      }
      
      if (hasErrors) {
        setFieldErrors(newFieldErrors);
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newFieldErrors.email = 'Please enter a valid email address';
        setFieldErrors(newFieldErrors);
        throw new Error('Please enter a valid email address');
      }

      // Validate password strength
      if (!validatePassword(password)) {
        newFieldErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and numbers';
        setFieldErrors(newFieldErrors);
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and numbers');
      }

      // Check if passwords match
      if (password !== confirmed_password) {
        newFieldErrors.confirmed_password = 'Passwords do not match';
        setFieldErrors(newFieldErrors);
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
        newFieldErrors.date_of_birth = 'You must be at least 13 years old to register';
        setFieldErrors(newFieldErrors);
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
            className={fieldErrors.first_name ? "border-red-500" : ""}
            required
          />
          {fieldErrors.first_name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={fieldErrors.last_name ? "border-red-500" : ""}
            required
          />
          {fieldErrors.last_name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>
          )}
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
          className={fieldErrors.email ? "border-red-500" : ""}
          required
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={fieldErrors.password ? "border-red-500" : ""}
          required
        />
        <p className="text-xs text-gray-500">
          Password must be at least 8 characters and include uppercase, lowercase, and numbers
        </p>
        {fieldErrors.password && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmed_password">Confirm Password <span className="text-red-500">*</span></Label>
        <Input
          id="confirmed_password"
          name="confirmed_password"
          type="password"
          value={formData.confirmed_password}
          onChange={handleChange}
          className={fieldErrors.confirmed_password ? "border-red-500" : ""}
          required
        />
        {fieldErrors.confirmed_password && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmed_password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
        <Input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={handleChange}
          max={maxDate}
          className={fieldErrors.date_of_birth ? "border-red-500" : ""}
          required
        />
        <p className="text-xs text-gray-500">
          You must be at least 13 years old to register
        </p>
        {fieldErrors.date_of_birth && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</p>
        )}
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

      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar/Image (Optional)</Label>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id="avatar"
            name="avatar"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-40 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
          >
            {formData.avatar ? 'Change Image' : 'Upload Image'}
          </Button>
          {formData.avatar && (
            <span className="text-sm text-gray-500 ml-2 truncate max-w-xs">
              {formData.avatar.name || 'Image selected'}
            </span>
          )}
        </div>
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
