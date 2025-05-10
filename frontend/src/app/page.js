"use client";

import { useEffect } from "react";
import PostForm from "@/components/post/PostForm";
import PostCard from "@/components/post/PostCard";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";

export default function Home() {
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
      <PostForm />

      {/* Feed */}
      <div className="space-y-4">
        {visiblePosts.length > 0 ? (
          visiblePosts.map(post => (
            <PostCard key={post.id} post={post} />
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
}