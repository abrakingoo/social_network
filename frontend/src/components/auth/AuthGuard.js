'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/ui/loading';

// This component is purely for redirections
export default function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // Skip redirection if still loading
    if (loading) return;

    // If not authenticated and not on auth page, redirect to login
    if (!isAuthenticated && !isAuthPage && pathname !== '/login') {
      router.push('/login');
    }
    
    // If authenticated and on auth page, redirect to home
    if (isAuthenticated && isAuthPage) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthPage, loading, router, pathname]);

  // This component doesn't render anything
  return null;
}
