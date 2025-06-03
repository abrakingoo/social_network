'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

const RegisterForm = ({ onSubmit, isLoading, backendErrors = {}, onClearBackendErrors }) => {
  const [maxDate, setMaxDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Clear client errors when backend errors arrive
  useEffect(() => {
    if (Object.keys(backendErrors).length > 0) {
      setError('');
      setFieldErrors({});
    }
  }, [backendErrors]);

  // Merge client-side and backend errors, prioritizing backend errors
  const displayErrors = { ...fieldErrors, ...backendErrors };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors when user starts typing
    if (displayErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));

      // Clear backend error for this field
      if (backendErrors[name] && onClearBackendErrors) {
        onClearBackendErrors(name);
      }
    }

    // Clear generic error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, avatar: e.target.files[0] }));
    }
  };

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Clear any previous backend errors since we're resubmitting
    if (Object.keys(backendErrors).length > 0) {
      // Don't show generic error when we have specific field errors
      return;
    }

    const newFieldErrors = {};
    const { email, password, confirmed_password, first_name, last_name, date_of_birth } = formData;

    // Client-side validation
    if (!first_name) newFieldErrors.first_name = 'First name is required';
    if (!last_name) newFieldErrors.last_name = 'Last name is required';
    if (!email) newFieldErrors.email = 'Email is required';
    if (!password) newFieldErrors.password = 'Password is required';
    if (!confirmed_password) newFieldErrors.confirmed_password = 'Please confirm your password';
    if (!date_of_birth) newFieldErrors.date_of_birth = 'Date of birth is required';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      setFieldErrors(newFieldErrors);
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      newFieldErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and numbers';
      setFieldErrors(newFieldErrors);
      setError('Password must be at least 8 characters and include uppercase, lowercase, and numbers');
      return;
    }

    if (password !== confirmed_password) {
      newFieldErrors.confirmed_password = 'Passwords do not match';
      setFieldErrors(newFieldErrors);
      setError('Passwords do not match');
      return;
    }

    // Age validation
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
      setError('You must be at least 13 years old to register');
      return;
    }

    const submissionData = { ...formData };
    if (!submissionData.avatar) {
      submissionData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(first_name + ' ' + last_name)}&background=random`;
    }
    submissionData.date_of_birth = birthDate.toISOString();

    // Clear any backend errors when making a new submission
    if (onClearBackendErrors && Object.keys(backendErrors).length > 0) {
      Object.keys(backendErrors).forEach(field => onClearBackendErrors(field));
    }

    onSubmit?.(submissionData);
  };

  const renderField = (id, label, type = 'text', required = false, extraProps = {}) => {
    if (type === 'password') {
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={id}
              name={id}
              type={id === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')}
              value={formData[id]}
              onChange={handleChange}
              className={`pr-10 ${displayErrors[id] ? "border-red-500" : ""}`}
              required={required}
              {...extraProps}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => id === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            >
              {id === 'password' ? (
                showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />
              ) : (
                showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />
              )}
              <span className="sr-only">{id === 'password' ? (showPassword ? 'Hide password' : 'Show password') : (showConfirmPassword ? 'Hide password' : 'Show password')}</span>
            </Button>
          </div>
          {displayErrors[id] && (
            <p className="text-red-500 text-xs mt-1">{displayErrors[id]}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={id}
          name={id}
          type={type}
          value={formData[id]}
          onChange={handleChange}
          className={displayErrors[id] ? "border-red-500" : ""}
          required={required}
          {...extraProps}
        />
        {displayErrors[id] && (
          <p className="text-red-500 text-xs mt-1">{displayErrors[id]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && Object.keys(backendErrors).length === 0 && (
        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {renderField('first_name', 'First Name', 'text', true)}
        {renderField('last_name', 'Last Name', 'text', true)}
      </div>

      {renderField('email', 'Email', 'email', true)}

      <div className="space-y-2">
        {renderField('password', 'Password', 'password', true)}
        <p className="text-xs text-gray-500">
          Password must be at least 8 characters and include uppercase, lowercase, and numbers
        </p>
      </div>

      {renderField('confirmed_password', 'Confirm Password', 'password', true)}

      <div className="space-y-2">
        {renderField('date_of_birth', 'Date of Birth', 'date', true, { max: maxDate })}
        <p className="text-xs text-gray-500">
          You must be at least 13 years old to register
        </p>
      </div>

      {renderField('nickname', 'Nickname (Optional)')}
      {renderField('about', 'About Me (Optional)')}

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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};

export default RegisterForm;