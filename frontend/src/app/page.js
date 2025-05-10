"use client";

import { useEffect } from "react";
import PostForm from "@/components/post/PostForm";
import PostCard from "@/components/post/PostCard";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";

export default function Home() {
  const { currentUser, login } = useAuth();
  const { posts } = usePosts();

  // Auto-login as test user if no user is logged in
  useEffect(() => {
    if (!currentUser) {
      // Use the test user credentials from context
      login("john@example.com", "password123", true);
    }
  }, [currentUser, login]);

  // Filter out duplicate posts (both from mock data and sample posts)
  const existingPostIds = posts.map(post => post.id);

  return (
    <div className="space-y-6">
      {/* Post Form */}
      <PostForm />

      {/* Feed */}
      <div className="space-y-4">
        {/* Show posts from context first */}
        {posts && posts.length > 0 && posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Add sample posts only if they don't conflict with existing posts */}
        {(!existingPostIds.includes("sample1")) && (
          <PostCard
            post={{
              id: "sample1",
              authorId: "1", // ID matching John Doe in AuthContext
              content: "Just launched my new website! Check it out and let me know what you think.",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
              likes: ["2"],
              comments: [
                {
                  id: "comment1",
                  authorId: "2", // ID matching Jane Smith in AuthContext
                  content: "Looks great! Congrats on the launch!",
                  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
                }
              ]
            }}
          />
        )}

        {(!existingPostIds.includes("sample2")) && (
          <PostCard
            post={{
              id: "sample2",
              authorId: "2", // ID matching Jane Smith in AuthContext
              content: "Working on some new artwork. Will share more details soon!",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
              likes: ["1"],
              comments: []
            }}
          />
        )}
      </div>
    </div>
  );
}