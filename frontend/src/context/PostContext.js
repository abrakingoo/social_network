'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '@/context/AuthContext';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Privacy levels
export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  SELECTED: 'selected'
};

// Default post structure for consistency
const DEFAULT_POST_STRUCTURE = {
  id: '',
  authorId: '',
  content: '',
  images: [],
  privacy: PRIVACY_LEVELS.PUBLIC,
  createdAt: '',
  likes: [],
  comments: []
};

// Default comment structure
const DEFAULT_COMMENT_STRUCTURE = {
  id: '',
  authorId: '',
  content: '',
  createdAt: ''
};

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Normalize post data to ensure consistent structure
  const normalizePost = useCallback((postData) => {
    if (!postData) return null;

    // Return a post with all required fields, using default values for missing ones
    return {
      ...DEFAULT_POST_STRUCTURE,
      id: postData.id || Date.now().toString(),
      content: postData.content || '',
      privacy: postData.privacy || PRIVACY_LEVELS.PUBLIC,
      createdAt: postData.createdAt || postData.created_at || new Date().toISOString(),
      likesCount: postData.likesCount || postData.likes || 0,
      dislikesCount: postData.dislikesCount || postData.dislikes || 0,
      commentsCount: postData.commentsCount || (postData.comments ? postData.comments.length : 0),
      comments: Array.isArray(postData.comments) ? postData.comments : [],
      media: Array.isArray(postData.media) ? postData.media : [],
      author: postData.user || postData.author || {
        id: currentUser?.id || '',
        first_name: currentUser?.firstName || '',
        last_name: currentUser?.lastName || ''
      }
    };
  }, [currentUser]);

  // Normalize comment data
  const normalizeComment = useCallback((commentData) => {
    return {
      ...DEFAULT_COMMENT_STRUCTURE,
      id: commentData.id || Date.now().toString(),
      authorId: commentData.authorId || (currentUser?.id || ''),
      createdAt: commentData.createdAt || new Date().toISOString(),
      ...commentData
    };
  }, [currentUser]);

  // Function to handle fetching posts from API
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/getPosts`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedPosts = Array.isArray(data) ? data :
                          (data.data && Array.isArray(data.data) ? data.data : []);

      setPosts(fetchedPosts.map(post => normalizePost(post)));
      return fetchedPosts;
    } catch (error) {
      toast.error(`Failed to load posts: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [normalizePost]);

  // Fetch posts when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [fetchPosts, currentUser]);

  // Add new post
  const addPost = useCallback(async (postData) => {
    if (!currentUser) {
      toast.error("You must be logged in to create a post");
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('privacy', postData.privacy);

      // Add images
      if (postData.images && postData.images.length > 0) {
        // Convert URLs back to File objects if needed
        for (const imageUrl of postData.images) {
          // Check if this is a File object or URL string
          if (imageUrl instanceof File) {
            formData.append('media', imageUrl);
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/addPost`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        toast.success('Post created successfully!');
        console.log('Post created successfully, refreshing posts...');

        // Refresh the posts list after successful creation
        setTimeout(async () => {
          console.log('Fetching posts after timeout...');
          await fetchPosts();
        }, 500);

        return true;
      } else {
        const errorText = await response.text();
        console.error('Error response from server:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to create post');
        } catch (jsonError) {
          throw new Error('Failed to create post: ' + response.status);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
      return false;
    }
  }, [currentUser, fetchPosts]);

  // Delete post
  const deletePost = useCallback((postId) => {
    if (!currentUser) return false;

    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== currentUser.id) {
      toast.error("You can only delete your own posts");
      return false;
    }

    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    toast.success("Post deleted successfully");
    return true;
  }, [currentUser, posts]);

  // Like/Unlike post
  const toggleLike = useCallback((postId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like posts");
      return false;
    }

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const userLiked = post.likes.includes(currentUser.id);
          const updatedLikes = userLiked
            ? post.likes.filter(id => id !== currentUser.id)
            : [...post.likes, currentUser.id];

          return { ...post, likes: updatedLikes };
        }
        return post;
      })
    );
    return true;
  }, [currentUser]);

  // Add comment to post
  const addComment = useCallback((postId, commentText) => {
    if (!currentUser) {
      toast.error("You must be logged in to comment");
      return false;
    }

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return false;
    }

    const newComment = normalizeComment({
      authorId: currentUser.id,
      content: commentText
    });

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      })
    );

    return true;
  }, [currentUser, normalizeComment]);

  // Delete comment
  const deleteComment = useCallback((postId, commentId) => {
    if (!currentUser) return false;

    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    const comment = post.comments && post.comments.find(c => c.id === commentId);
    if (!comment || (comment.authorId !== currentUser.id && comment.author?.id !== currentUser.id)) {
      toast.error("You can only delete your own comments");
      return false;
    }

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId && post.comments) {
          return {
            ...post,
            comments: post.comments.filter(c => c.id !== commentId)
          };
        }
        return post;
      })
    );

    return true;
  }, [currentUser, posts]);

  // Get filtered posts (simplified to only show public posts for now)
  const getFilteredPosts = useCallback(() => {
    if (!currentUser || !posts.length) return [];

    const filteredPosts = posts.filter(post => {
      if (!post) return false;

      // User can always see their own posts
      if (post.author && post.author.id === currentUser.id) {
        return true;
      }

      // If post is public, everyone can see it
      return post.privacy === PRIVACY_LEVELS.PUBLIC;
    });

    // Sort posts by creation date (newest first)
    return [...filteredPosts].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });
  }, [currentUser, posts]);

  // Get posts by user ID (simplified)
  const getUserPosts = useCallback((userId) => {
    if (!userId || !posts.length) return [];
    return posts.filter(post => post.author && post.author.id === userId);
  }, [posts]);

  const value = {
    posts,
    loading,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    getFilteredPosts,
    getUserPosts,
    fetchPosts,
    normalizePost,
    normalizeComment,
    PRIVACY_LEVELS
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};
