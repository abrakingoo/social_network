'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '@/context/AuthContext';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Privacy levels
export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FOLLOWERS: 'almost_private',
  SELECTED: 'private'
};

// Default post structure for consistency
const DEFAULT_POST_STRUCTURE = {
  id: '',
  authorId: '',
  content: '',
  images: [],
  privacy: PRIVACY_LEVELS.PUBLIC,
  createdAt: '',
  comments: []
};

// Default comment structure
const DEFAULT_COMMENT_STRUCTURE = {
  id: '',
  authorId: '',
  content: '',
  createdAt: '',
  media: []
};

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, checkAuth } = useAuth();

  // Normalize comment data
  const normalizeComment = useCallback((commentData) => {
    let extractedFirstName = 'Unknown';
    let extractedLastName = 'User';
    if (currentUser?.avatar && currentUser.avatar.includes('name=')) {
      const namePart = currentUser.avatar.split('name=')[1]?.split('&')[0];
      if (namePart) {
        const decodedName = decodeURIComponent(namePart).trim();
        const nameParts = decodedName.split(' ');
        if (nameParts.length >= 2) {
          extractedFirstName = nameParts[0];
          extractedLastName = nameParts[1];
        } else if (nameParts.length === 1) {
          extractedFirstName = nameParts[0];
          extractedLastName = '';
        }
      }
    }

    const authorName = currentUser?.nickname || `${extractedFirstName} ${extractedLastName}`.trim();
    const nameParts = authorName.split(' ');
    const firstNameToUse = nameParts.length > 0 ? nameParts[0] : 'Unknown';
    const lastNameToUse = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    return {
      ...DEFAULT_COMMENT_STRUCTURE,
      id: commentData.id || Date.now().toString(),
      authorId: commentData.authorId || (currentUser?.id || ''),
      createdAt: commentData.createdAt || commentData.created_at || new Date().toISOString(),
      author: {
        id: currentUser?.id || '',
        firstName: currentUser?.firstName || firstNameToUse,
        lastName: currentUser?.lastName || lastNameToUse,
        nickname: currentUser?.nickname || '',
        avatar: currentUser?.avatar || ''
      },
      likedByCurrentUser: commentData.likedByCurrentUser || commentData.is_liked || false,
      likesCount: commentData.likesCount || commentData.likes_count || 0,
      media: Array.isArray(commentData.media) ? commentData.media : [],
      ...commentData
    };
  }, [currentUser]);

  // Normalize post data to ensure consistent structure
  const normalizePost = useCallback((postData) => {
    if (!postData) return null;

    const normalizedComments = Array.isArray(postData.comments)
      ? postData.comments
          .map(comment => ({
            ...normalizeComment(comment),
            likedByCurrentUser: comment.likedByCurrentUser || comment.is_liked || false,
            likesCount: comment.likesCount || comment.likes_count || 0,
            author: comment.user || comment.author || {
              id: comment.user?.id || "",
              firstName: comment.user?.first_name || "",
              lastName: comment.user?.last_name || "",
              nickname: comment.user?.nickname || "",
              avatar: comment.user?.avatar || ""
            }
          }))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      : [];

    // Return a post with all required fields, using default values for missing ones
    return {
      ...DEFAULT_POST_STRUCTURE,
      id: postData.id || Date.now().toString(),
      content: postData.content || '',
      privacy: postData.privacy || PRIVACY_LEVELS.PUBLIC,
      createdAt: postData.createdAt || postData.created_at || new Date().toISOString(),
      comments: normalizedComments,
      media: Array.isArray(postData.media) ? postData.media : [],
      author: postData.user || postData.author || {
        id: currentUser?.id || '',
        first_name: currentUser?.firstName || '',
        last_name: currentUser?.lastName || ''
      },
      likesCount: postData.likes_count || 0,
      likedByCurrentUser: postData.is_liked || false,
    };
  }, [currentUser, normalizeComment]);

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
      // Add visible_to for private posts
      if (postData.privacy === 'private' && postData.selectedUsers && postData.selectedUsers.length > 0) {
        formData.append('visible_to', JSON.stringify(postData.selectedUsers));
      }

      // Add group_id for group posts
      if (postData.groupId) {
        formData.append('group_id', postData.groupId);
      }

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

        // Only refresh global posts if this is NOT a group post
        if (!postData.groupId) {
          // Refresh the posts list after successful creation
          setTimeout(async () => {
            await fetchPosts();
          }, 500);
        }

        // Refresh currentUser data to update userposts for Photos tab
        await checkAuth();

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
  }, [currentUser, fetchPosts, checkAuth, API_BASE_URL]);

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

  // Add comment to post
  const addComment = useCallback(async (postId, commentText, commentImages = []) => {
    if (!currentUser) {
      toast.error("You must be logged in to comment");
      return false;
    }

    if (!commentText.trim()) {
      toast.error("Comment text is required");
      return false;
    }

    const newComment = normalizeComment({
      content: commentText,
      media: commentImages.map(img => URL.createObjectURL(img)) // Create preview URLs for optimistic update
    });

    // Optimistically update the UI
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), newComment],
            commentsCount: (post.commentsCount || 0) + 1
          };
        }
        return post;
      })
    );

    try {
      // Send comment to backend using FormData (backend expects multipart form data)
      const formData = new FormData();
      formData.append('post_id', postId);
      formData.append('content', commentText);
      formData.append('comment_id', newComment.id);

      // Add images to FormData
      if (commentImages && commentImages.length > 0) {
        commentImages.forEach((image) => {
          formData.append('media', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/addComment`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status} ${response.statusText}`);
      }

      // Comment successfully added to backend
      return true;
    } catch (error) {
      toast.error(`Failed to add comment: ${error.message}`);
      // Revert optimistic update on failure
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: (post.comments || []).filter(c => c.id !== newComment.id),
              commentsCount: (post.commentsCount || 1) - 1
            };
          }
          return post;
        })
      );
      return false;
    }
  }, [currentUser, normalizeComment, API_BASE_URL]);

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

  // Get filtered posts
  const getFilteredPosts = useCallback(() => {
    if (!currentUser || !posts.length) return [];

    const filteredPosts = posts.filter(post => {
      return post && post.id; // Basic validation
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

  const toggleLike = useCallback(async (postId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like a post.");
      return;
    }

    const originalPosts = [...posts];

    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const wasLiked = post.likedByCurrentUser;
          return {
            ...post,
            likedByCurrentUser: !wasLiked,
            likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/likePost`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to like post: ${response.status}`);
      }

    } catch (error) {
      toast.error(`Error: ${error.message}`);
      // Revert on error
      setPosts(originalPosts);
    }
  }, [currentUser, posts]);

  const toggleCommentLike = useCallback(async (postId, commentId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like a comment.");
      return;
    }

    const originalPosts = [...posts];

    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                const wasLiked = comment.likedByCurrentUser;
                return {
                  ...comment,
                  likedByCurrentUser: !wasLiked,
                  likesCount: wasLiked ? comment.likesCount - 1 : comment.likesCount + 1,
                };
              }
              return comment;
            }),
          };
        }
        return post;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/likeComment`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId, comment_id: commentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to like comment: ${response.status}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      // Revert on error
      setPosts(originalPosts);
    }
  }, [currentUser, posts]);

  const value = {
    posts,
    loading,
    addPost,
    deletePost,
    addComment,
    deleteComment,
    getFilteredPosts,
    getUserPosts,
    fetchPosts,
    normalizePost,
    normalizeComment,
    toggleLike,
    toggleCommentLike,
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
