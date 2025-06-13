"use client";

import { useEffect, Suspense, lazy, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";
import Loading from "@/components/ui/loading";
import { redirect } from "next/navigation";

// Lazy load components that aren't needed immediately
const PostForm = lazy(() => import("@/components/post/PostForm"));
const PostCard = lazy(() => import("@/components/post/PostCard"));

// Extracting the content into a separate component for Suspense
const HomeContent = () => {
  const { currentUser, loading } = useAuth();
  const { posts, getFilteredPosts } = usePosts();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Show loading state when checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Get the posts visible to the current user
  const visiblePosts = currentUser ? getFilteredPosts() : [];
  if (!currentUser) {
    redirect("/login");
  }
  return (
    <div className={`space-y-1 ${isMobile ? "-mx-4" : ""}`}>
      {/* Post Form */}
      <Suspense
        fallback={
          <div
            className={`h-32 bg-gray-100 animate-pulse rounded-lg ${isMobile ? "rounded-none" : ""}`}
          ></div>
        }
      >
        <PostForm />
      </Suspense>

      {/* Feed */}
      <div className="space-y-1">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post) => (
            <Suspense
              key={post.id}
              fallback={
                <div
                  className={`h-64 bg-gray-100 animate-pulse rounded-lg ${isMobile ? "rounded-none" : ""}`}
                ></div>
              }
            >
              <PostCard post={post} />
            </Suspense>
          ))
        ) : (
          <div
            className={`text-center p-8 bg-white ${isMobile ? "shadow-none rounded-none border-x-0" : "rounded-lg shadow-sm"}`}
          >
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
