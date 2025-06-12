"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostProvider } from "@/context/PostContext";
import { AuthProvider } from "@/context/AuthContext";
import { GroupProvider } from "@/context/GroupContext";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Dynamic imports for non-critical components
const LeftSidebar = dynamic(() => import("@/components/layout/LeftSidebar"), {
  ssr: false,
  loading: () => <div className="w-64 hidden md:block" />
});

const RightSidebar = dynamic(() => import("@/components/layout/RightSidebar"), {
  ssr: false,
  loading: () => <div className="w-64 hidden lg:block" />
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

// Component to wrap the authenticated content
const AuthenticatedLayout = ({ children }) => {
  const pathname = usePathname();
  const isMessagesPage = pathname === '/messages';
  const [isMobile, setIsMobile] = useState(false);

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

  // Check if on authentication pages (now handled by route groups)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Show full layout only for non-auth pages
  const showSidebars = !isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 bg-gray-100 pt-4">
        <div className="container mx-auto flex max-w-7xl">
          {showSidebars && !isMessagesPage && <LeftSidebar />}
          <main className={`flex-1 ${isMobile ? 'px-0' : 'px-4'}`}>
            {children}
          </main>
          {showSidebars && <RightSidebar />}
        </div>
      </div>
    </div>
  );
};

export default function RootLayoutClient({ children }) {
  const pathname = usePathname();

  // Check if current route is in the (auth) group
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register');

  // Don't wrap auth routes with the layout - they use their own layout
  if (isAuthRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <PostProvider>
              {children}
            </PostProvider>
          </AuthProvider>
          <Toaster />
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <PostProvider>
              <GroupProvider>
                <Toaster />
                <AuthenticatedLayout>
                  {children}
                </AuthenticatedLayout>
              </GroupProvider>
            </PostProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}