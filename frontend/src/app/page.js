"use client";

import { useEffect, Suspense, lazy, useState } from "react";
import Loading from "@/components/ui/loading";

// Lazy load components that aren't needed immediately
const PostForm = lazy(() => import("@/components/post/PostForm"));
const PostCard = lazy(() => import("@/components/post/PostCard"));

// Mock posts for the feed page
const mockPosts = [
  {
    id: '1',
    authorId: '1',
    content: 'Welcome to the social network! This is your feed page.',
    images: [],
    privacy: 'public',
    createdAt: new Date().toISOString(),
    likes: ['2'],
    comments: [
      {
        id: '1',
        authorId: '2',
        content: 'Great to see you here!',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: '2',
    authorId: '2',
    content: 'This is a sample post with an image!',
    images: ['https://images.unsplash.com/photo-1682687221080-5cb261c645cb'],
    privacy: 'public',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: ['1'],
    comments: []
  },
  {
    id: '3',
    authorId: '3',
    content: 'Check out this amazing view from my trip!',
    images: ['https://images.unsplash.com/photo-1682685797366-715d29e33f9d'],
    privacy: 'public',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: ['1', '2'],
    comments: [
      {
        id: '2',
        authorId: '1',
        content: 'Looks fantastic! Where is this?',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
];

// Mock user data to use in place of AuthContext
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'user@example.com',
  avatar: ''
};

// Main Home content component
const HomeContent = () => {
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

  return (
    <div className={`space-y-1 ${isMobile ? '-mx-4' : ''}`}>
      {/* Post Form */}
      <Suspense fallback={<div className={`h-32 bg-gray-100 animate-pulse rounded-lg ${isMobile ? 'rounded-none' : ''}`}></div>}>
        <PostForm user={mockUser} />
      </Suspense>

      {/* Feed - Always show mock posts */}
      <div className="space-y-1">
        {mockPosts.map(post => (
          <Suspense key={post.id} fallback={<div className={`h-64 bg-gray-100 animate-pulse rounded-lg ${isMobile ? 'rounded-none' : ''}`}></div>}>
            <PostCard post={post} currentUser={mockUser} />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}