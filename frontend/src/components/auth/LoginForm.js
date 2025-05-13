'use client';

import React, { useState, useCallback, memo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const LoginForm = memo(({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const handleRememberMeChange = useCallback((checked) => {
    setRememberMe(checked);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form
      if (!email.trim()) {
        throw new Error('Email is required');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Call the provided onSubmit handler
      if (onSubmit) {
        onSubmit({ email, password, rememberMe });
      }

    } catch (err) {
      setError(err.message);
    }
  }, [email, password, rememberMe, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="#"
            className="text-sm text-blue-600 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              // Password reset functionality would be implemented here
            }}
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={handleRememberMeChange}
        />
        <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;
