"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostProvider } from "@/context/PostContext";
import { ToastProvider } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import dynamic from 'next/dynamic';
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

// Component to wrap the content
const MainLayout = ({ children }) => {
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

  // Always show sidebars - removed authentication checks
  const showSidebars = true;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 bg-gray-100 pt-4">
        <div className="container mx-auto flex max-w-7xl">
          {/* Always show left sidebar except on messages page */}
          {!isMessagesPage && <LeftSidebar />}
          <main className="flex-1 px-4">
            {children}
          </main>
          {/* Always show right sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};



export default function RootLayoutClient({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <PostProvider>
            <Sonner />
            <MainLayout>
              {children}
            </MainLayout>
          </PostProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}