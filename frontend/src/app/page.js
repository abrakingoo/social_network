'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the login page as soon as the component mounts
    router.replace('/login');
  }, [router]);
  
  // Return a minimal loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-blue-600 text-xl font-semibold">
        Loading...
      </div>
    </div>
  );
}
