'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const LoginForm = memo(({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
    }
  }, [fieldErrors.email]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    if (fieldErrors.credentials) {
      setFieldErrors(prev => ({ ...prev, credentials: null }));
    }
  }, [fieldErrors.credentials]);

  const handleRememberMeChange = useCallback((checked) => {
    setRememberMe(checked);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validation
    const errors = {};
    if (!email.trim()) errors.email = 'Email or nickname is required';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        password,
        rememberMe
      });
    } catch (error) {
      // Handle server validation errors
      if (error.type === 'validation' && error.field === 'credentials') {
        setFieldErrors({ credentials: error.message });
      } else if (error.type === 'rate_limit') {
        setFieldErrors({ general: error.message });
      }
      // Other errors are handled by parent component
    }
  }, [email, password, rememberMe, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fieldErrors.general && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {fieldErrors.general}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email or Nickname</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter nickname or email address"
          value={email}
          onChange={handleEmailChange}
          className={fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}
          disabled={isLoading}
          required
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
          className={fieldErrors.password || fieldErrors.credentials ? "border-red-500 focus:border-red-500" : ""}
          disabled={isLoading}
          required
        />
        {(fieldErrors.password || fieldErrors.credentials) && (
          <p className="text-red-500 text-xs mt-1">
            {fieldErrors.password || fieldErrors.credentials}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={handleRememberMeChange}
          disabled={isLoading}
        />
        <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-social hover:bg-social-dark disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;