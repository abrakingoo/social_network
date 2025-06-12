'use client';

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <Toaster />
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="text-social font-bold text-2xl">
                  social<span className="text-social-accent">network</span>
                </Link>
              </div>
            </div>
          </header>
          <div className="flex items-center justify-center flex-1 bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
              {children}
            </div>
          </div>
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
