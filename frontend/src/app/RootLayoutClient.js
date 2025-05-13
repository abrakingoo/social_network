"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { PostProvider } from "@/context/PostContext";
import { ToastProvider } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import dynamic from 'next/dynamic';

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

export default function RootLayoutClient({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <PostProvider>
              <Sonner />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex flex-1 bg-gray-100 pt-4">
                  <div className="container mx-auto flex max-w-7xl">
                    <LeftSidebar />
                    <main className="flex-1 px-4">
                      {children}
                    </main>
                    <RightSidebar />
                  </div>
                </div>
              </div>
            </PostProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}