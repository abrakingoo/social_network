'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Share2, MoreHorizontal, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

import { usePosts } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import PostCardLightbox from './PostCardLightbox';
import { formatAvatarUrl } from '@/lib/utils';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PostCard = ({ post, onToggleLike, onToggleCommentLike, onAddComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  // Get the current user from context
  const { currentUser } = useAuth();
  const { addComment, deletePost, toggleLike, toggleCommentLike } = usePosts();

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const normalizePost = (inputPost) => {
    // Return null if post is missing or not an object
    if (!inputPost || typeof inputPost !== 'object') {
      return null;
    }

    // Create a normalized post with default values for missing properties
    return {
      id: inputPost.id || `post-${Math.random().toString(36).substring(2, 9)}`,
      author: inputPost.user || inputPost.author || {}, // Backend uses 'user' field for the author
      content: inputPost.content || '',
      createdAt: inputPost.createdAt || inputPost.created_at || inputPost.timestamp || new Date().toISOString(),
      likesCount: inputPost.likesCount || inputPost.likes_count || 0,
      dislikesCount: inputPost.dislikesCount || inputPost.dislikes_count || 0,
      commentsCount: inputPost.commentsCount || inputPost.comments_count || 0,
      comments: Array.isArray(inputPost.comments) ? inputPost.comments : [],
      media: Array.isArray(inputPost.media) ? inputPost.media.map(m => m.URL || m.url) : [],
      privacy: inputPost.privacy || 'public',
      likedByCurrentUser: inputPost.likedByCurrentUser || inputPost.is_liked || false,
    };
  };

  // Normalize the post data
  const normalizedPost = normalizePost(post);

  // If normalized post is null, don't render anything
  if (!normalizedPost) {
    return null;
  }

  const author = normalizedPost.author;
  const isAuthor = currentUser && currentUser.id === author.id;

  // Author data access with fallbacks from backend format
  const firstName = author.first_name || author.firstName || 'Unknown';
  const lastName = author.last_name || author.lastName || 'User';
  const authorName = author.nickname || `${firstName} ${lastName}`;

  const formattedDate = formatDistanceToNow(new Date(normalizedPost.createdAt), { addSuffix: true });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?') && typeof deletePost === 'function') {
      deletePost(normalizedPost.id);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      // Use onAddComment prop if provided (for group posts), otherwise use context method
      const commentHandler = onAddComment || addComment;
      if (typeof commentHandler === 'function') {
        const success = await commentHandler(normalizedPost.id, commentText);
        if (success !== false) { // Success or undefined (context method doesn't return value)
          setCommentText('');
          // Reset textarea height
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }
      }
    }
  };

  const getCommentAuthor = (comment) => {
    // Default fallback values
    let commentAuthorName = 'Anonymous User';
    let commentAvatarUrl = '';

    // First check if comment has a user object (backend response format)
    if (comment.user && typeof comment.user === 'object') {
      const firstName = comment.user.firstName || comment.user.first_name || 'Anonymous';
      const lastName = comment.user.lastName || comment.user.last_name || 'User';
      commentAuthorName = comment.user.nickname || `${firstName} ${lastName}`;
      commentAvatarUrl = formatAvatarUrl(comment.user.avatar || '');
    }
    else if (comment.author && typeof comment.author === 'object') {
      const firstName = comment.author.firstName || comment.author.first_name || 'Anonymous';
      const lastName = comment.author.lastName || comment.author.last_name || 'User';
      commentAuthorName = comment.author.nickname || `${firstName} ${lastName}`;
      commentAvatarUrl = formatAvatarUrl(comment.author.avatar || '');
    } else if (comment.authorId && typeof comment.authorId === 'string') {
      // If only authorId is available, we might not have full details, but check if it's the current user
      if (currentUser && currentUser.id === comment.authorId) {
        commentAuthorName = currentUser.nickname || `${currentUser.firstName || 'Anonymous'} ${currentUser.lastName || 'User'}`;
        commentAvatarUrl = formatAvatarUrl(currentUser.avatar || '');
      }
    }

    return { commentAuthorName, commentAvatarUrl };
  };

  const renderComments = () => {
    if (normalizedPost.comments.length === 0) {
      return <p className="text-sm text-gray-500 p-4">No comments yet.</p>;
    }

    return (
      <div className="space-y-4 p-4">
        {normalizedPost.comments.map((comment) => {
          const { commentAuthorName, commentAvatarUrl } = getCommentAuthor(comment);

          return (
            <div key={comment.id || Math.random().toString(36).substring(2)} className="flex space-x-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={commentAvatarUrl} alt={commentAuthorName} />
                <AvatarFallback>
                  {commentAuthorName.split(' ')[0]?.[0] || 'A'}{commentAuthorName.split(' ')[1]?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{commentAuthorName}</div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-full overflow-hidden">
                  <p className="text-sm break-words whitespace-normal">{escapeHtml(comment.content)}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(comment.createdAt || comment.created_at), { addSuffix: true })}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-1 text-gray-500 hover:bg-blue-500 ${
                      (comment.likedByCurrentUser || comment.is_liked) ? 'text-red-500 fill-current' : 'text-gray-500'
                    }`}
                    onClick={() => (onToggleCommentLike || toggleCommentLike)(normalizedPost.id, comment.id)}
                  >
                    <Heart className={`h-4 w-4 ${(comment.likedByCurrentUser || comment.is_liked) ? 'fill-current' : ''}`} />
                    <span>{comment.likesCount || comment.likes_count || 0}</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Function to escape HTML tags to prevent XSS and unwanted rendering
  const escapeHtml = (text) => {
    if (!text) return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count;
    }
  };

  const renderInteractions = () => (
    <CardFooter className="flex justify-between p-2">
      <div className="flex space-x-4">
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:bg-blue-500" onClick={() => (onToggleLike || toggleLike)(normalizedPost.id)}>
          <Heart className={`h-5 w-5 ${normalizedPost.likedByCurrentUser ? 'text-red-500 fill-current' : ''}`} />
          <span>{formatCount(normalizedPost.likesCount)}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:bg-blue-500" onClick={() => setShowComments(!showComments)}>
          <MessageSquare className="h-5 w-5" />
          <span>{formatCount(normalizedPost.comments.length)}</span>
        </Button>
      </div>
    </CardFooter>
  );

  return (
    <div className={`max-w-4xl mx-auto ${isMobile ? '-mx-4' : ''}`}>
      {/* Lightbox for images */}
      <PostCardLightbox
        open={lightboxOpen}
        images={normalizedPost.media.map(img => `${API_BASE_URL}/${img}`)}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((prev) => (prev - 1 + normalizedPost.media.length) % normalizedPost.media.length)}
        onNext={() => setLightboxIndex((prev) => (prev + 1) % normalizedPost.media.length)}
      />
      <Card className={`mb-1 bg-white ${isMobile ? 'shadow-none rounded-none border-x-0' : 'shadow-sm'}`}>
        <CardHeader className="pt-4 pb-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={formatAvatarUrl(author.avatar)} alt={authorName} />
                <AvatarFallback>{firstName?.[0] || ''}{lastName?.[0] || ''}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{authorName}</div>
                <div className="text-xs text-gray-500">{formattedDate}</div>
              </div>
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          <p className="whitespace-pre-wrap">{escapeHtml(normalizedPost.content)}</p>

          {normalizedPost.media && normalizedPost.media.length > 0 && (
            <div className={`mt-3 rounded-xl overflow-hidden ${normalizedPost.media.length > 1 ? 'grid gap-1' : ''
              } ${normalizedPost.media.length === 2 ? 'grid-cols-2' :
                normalizedPost.media.length === 3 ? 'grid-cols-2' :
                  normalizedPost.media.length >= 4 ? 'grid-cols-2' : ''
              }`}>
              {normalizedPost.media.map((image, index) => {
                // Calculate aspect ratio and row spans for different image counts
                let aspectRatio = '';
                let rowSpan = '';

                if (normalizedPost.media.length === 1) {
                  aspectRatio = 'aspect-auto max-h-[500px]';
                } else if (normalizedPost.media.length === 2) {
                  aspectRatio = 'aspect-square';
                } else if (normalizedPost.media.length === 3) {
                  if (index === 0) {
                    aspectRatio = 'aspect-video';
                    rowSpan = 'row-span-2';
                  } else {
                    aspectRatio = 'aspect-square';
                  }
                } else if (normalizedPost.media.length >= 4) {
                  aspectRatio = 'aspect-square';
                }

                return (
                  <div
                    key={index}
                    className={`relative ${rowSpan} group cursor-pointer`}
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    <img
                      src={`${API_BASE_URL}/${image}`}
                      alt={`Post image ${index + 1}`}
                      className={`w-full h-full object-contain ${aspectRatio} transition-transform group-hover:scale-105`}
                    />
                    {normalizedPost.media.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{normalizedPost.media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {renderInteractions()}

        {showComments && (
          <CardFooter className="flex flex-col p-0">
            <div className={`border-t border-gray-200 w-full ${isMobile ? 'border-x-0' : ''}`}>
              {renderComments()}
            </div>

            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex items-center p-4 space-x-2 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={formatAvatarUrl(currentUser.avatar)} alt={currentUser.firstName} />
                  <AvatarFallback>{currentUser.firstName?.[0] || ''}{currentUser.lastName?.[0] || ''}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none bg-gray-100 rounded-lg min-h-[40px] max-h-[120px] overflow-hidden"
                  rows={1}
                  ref={textareaRef}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                <Button type="submit" size="icon" className="rounded-full">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default PostCard;
