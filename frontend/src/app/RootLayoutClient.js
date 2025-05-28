"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostProvider } from "@/context/PostContext";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import AuthRedirect from "@/components/auth/AuthGuard";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Dynamic imports for non-critical components
const LeftSidebar = dynamic(() => import("@/components/layout/LeftSidebar"), {
  ssr: false,
  loading: () => <div className="w-64" />
});

const RightSidebar = dynamic(() => import("@/components/layout/RightSidebar"), {
  ssr: false,
  loading: () => <div className="w-64" />
});

// Create QueryClient outside of component to prevent re-initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});



// Component that will only render once wrapped in AuthProvider
function MainContent({ children }) {
  const pathname = usePathname();
  const isMessagesPage = pathname === '/messages';
  const [isMobile, setIsMobile] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Check if current path is an auth page (login or register)
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // Use authenticated user from context or fallback to mock user
  const currentUser = user || {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    avatar: ''
  };

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Only show sidebars for authenticated users and non-auth pages
  const showSidebars = isAuthenticated && !isAuthPage;

  // For auth pages (login/register) show a simplified layout
  if (isAuthPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16">
              <Link href="/" className="text-social font-bold text-2xl">social<span className="text-social-accent">network</span></Link>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          {children}
        </div>
      </div>
    );
  }

  // For authenticated pages, show the full layout
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 bg-gray-100 pt-4">
        <div className="container mx-auto flex max-w-7xl">
          {/* Show left sidebar except on messages page */}
          {showSidebars && !isMessagesPage && <LeftSidebar />}
          <main className="flex-1 px-4">
            {children}
          </main>
          {/* Show right sidebar for authenticated users */}
          {showSidebars && <RightSidebar />}
        </div>
      </div>
    </div>
  );
}

export default function RootLayoutClient({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <PostProvider>
              <Sonner />
              <AuthRedirect />
              <MainContent>
                {children}
              </MainContent>
            </PostProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}