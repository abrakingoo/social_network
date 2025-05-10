"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { PostProvider } from "@/context/PostContext";
import { ToastProvider } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";

export default function RootLayoutClient({ children }) {
  // Create a new QueryClient instance
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <PostProvider>
              <Toaster />
              <Sonner />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex flex-1 bg-gray-100">
                  <LeftSidebar />
                  <main className="flex-1 py-4 px-4 md:px-0">
                    {children}
                  </main>
                  <RightSidebar />
                </div>
              </div>
            </PostProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}