
import React, { createContext, useState, useContext, useCallback } from 'react';
import { toast } from "@/components/ui/sonner";
import { useAuth } from './AuthContext';

// Privacy levels
export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  SELECTED: 'selected'
};

// Mock posts data
const INITIAL_POSTS = [
  {
    id: '1',
    authorId: '1',
    content: 'Just launched my new website! Check it out and let me know what you think.',
    images: [],
    privacy: PRIVACY_LEVELS.PUBLIC,
    createdAt: '2023-09-15T10:30:00Z',
    likes: ['2'],
    comments: [
      {
        id: '1',
        authorId: '2',
        content: 'Looks great! Congrats on the launch!',
        createdAt: '2023-09-15T11:45:00Z'
      }
    ]
  },
  {
    id: '2',
    authorId: '1',
    content: 'Beautiful sunset at the beach today. Nature is amazing! 🌅',
    images: ['https://images.unsplash.com/photo-1500673922987-e212871fec22'],
    privacy: PRIVACY_LEVELS.FOLLOWERS,
    createdAt: '2023-09-14T18:20:00Z',
    likes: [],
    comments: []
  },
  {
    id: '3',
    authorId: '2',
    content: 'Working on some new artwork. Will share more details soon!',
    images: [],
    privacy: PRIVACY_LEVELS.PUBLIC,
    createdAt: '2023-09-13T14:10:00Z',
    likes: ['1'],
    comments: [
      {
        id: '2',
        authorId: '1',
        content: 'Can\'t wait to see it!',
        createdAt: '2023-09-13T15:30:00Z'
      }
    ]
  }
];

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const { currentUser, getUserById } = useAuth();

  // Add new post
  const addPost = useCallback((postData) => {
    if (!currentUser) {
      toast.error("You must be logged in to create a post");
      return false;
    }
    
    const newPost = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      ...postData
    };
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast.success("Post created successfully");
    return true;
  }, [currentUser]);

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
    
    const newComment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      content: commentText,
      createdAt: new Date().toISOString()
    };
    
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
  }, [currentUser]);

  // Delete comment
  const deleteComment = useCallback((postId, commentId) => {
    if (!currentUser) return false;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment || comment.authorId !== currentUser.id) {
      toast.error("You can only delete your own comments");
      return false;
    }
    
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
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

  // Fetch user's visible posts
  const getVisiblePosts = useCallback(() => {
    if (!currentUser) return [];
    
    return posts.filter(post => {
      // If user is post author, they can see it
      if (post.authorId === currentUser.id) return true;
      
      // If post is public, everyone can see it
      if (post.privacy === PRIVACY_LEVELS.PUBLIC) return true;
      
      // For followers-only posts, check if user follows the author
      if (post.privacy === PRIVACY_LEVELS.FOLLOWERS) {
        const author = getUserById(post.authorId);
        return author && author.followers.includes(currentUser.id);
      }
      
      // For selected-only posts, check if user is in the selected list
      // (This is a placeholder - actual implementation would check a selectedUsers array)
      if (post.privacy === PRIVACY_LEVELS.SELECTED) {
        return false; // For now, no one sees selected posts except the author
      }
      
      return false;
    });
  }, [currentUser, posts, getUserById]);

  // Get posts by user ID
  const getUserPosts = useCallback((userId) => {
    if (!currentUser) return [];
    
    // If fetching own posts, return all
    if (userId === currentUser.id) {
      return posts.filter(post => post.authorId === userId);
    }
    
    const user = getUserById(userId);
    if (!user) return [];
    
    // For other users, filter by visibility
    return posts.filter(post => {
      if (post.authorId !== userId) return false;
      
      // If post is public, show it
      if (post.privacy === PRIVACY_LEVELS.PUBLIC) return true;
      
      // If post is for followers only, check if current user is a follower
      if (post.privacy === PRIVACY_LEVELS.FOLLOWERS) {
        return user.followers.includes(currentUser.id);
      }
      
      // Selected users only (not implemented yet)
      return false;
    });
  }, [currentUser, posts, getUserById]);

  const value = {
    posts,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    getVisiblePosts,
    getUserPosts,
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
