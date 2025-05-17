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
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  }, [fieldErrors]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
  }, [fieldErrors]);

  const handleRememberMeChange = useCallback((checked) => {
    setRememberMe(checked);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const newFieldErrors = {};
    let hasErrors = false;

    try {
      // Validate form
      if (!email.trim()) {
        newFieldErrors.email = 'Email or nickname is required';
        hasErrors = true;
      }

      if (!password) {
        newFieldErrors.password = 'Password is required';
        hasErrors = true;
      }
      
      if (hasErrors) {
        setFieldErrors(newFieldErrors);
        throw new Error('Please fill in all required fields');
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
        <Label htmlFor="email">Email or Nickname</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter nickname or email address"
          value={email}
          onChange={handleEmailChange}
          className={fieldErrors.email ? "border-red-500" : ""}
          required
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className={fieldErrors.password ? "border-red-500" : ""}
          required
        />
        {fieldErrors.password && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
        )}
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
        className="w-full bg-social hover:bg-social-dark"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>


    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;
