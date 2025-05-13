"use client";

import { useEffect, Suspense, lazy } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";
import Loading from "@/components/ui/loading";

// Lazy load components that aren't needed immediately
const PostForm = lazy(() => import("@/components/post/PostForm"));
const PostCard = lazy(() => import("@/components/post/PostCard"));

// Extracting the content into a separate component for Suspense
const HomeContent = () => {
  const { currentUser, login } = useAuth();
  const { posts, getVisiblePosts } = usePosts();

  // Auto-login as test user if no user is logged in
  useEffect(() => {
    if (!currentUser) {
      // Use the test user credentials from context
      login("john@example.com", "password123", true);
    }
  }, [currentUser, login]);

  // Get the posts visible to the current user
  const visiblePosts = currentUser ? getVisiblePosts() : [];

  return (
    <div className="space-y-6">
      {/* Post Form */}
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>}>
        <PostForm />
      </Suspense>

      {/* Feed */}
      <div className="space-y-4">
        {visiblePosts.length > 0 ? (
          visiblePosts.map(post => (
            <Suspense key={post.id} fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
              <PostCard post={post} />
            </Suspense>
          ))
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
            <p className="text-gray-500 mt-2">
              {currentUser
                ? "Posts from you and people you follow will appear here."
                : "Please log in to see posts."}
            </p>
          </div>
        )}
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