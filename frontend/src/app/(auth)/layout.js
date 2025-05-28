'use client';

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/hooks/use-toast";
import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <Sonner />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          {children}
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
