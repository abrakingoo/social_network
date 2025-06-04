'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Share2, MoreHorizontal, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PostCard = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  // Get the current user from context
  const { currentUser } = useAuth();
  const { toggleLike, addComment, deletePost } = usePosts();

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
      createdAt: inputPost.createdAt || inputPost.timestamp || new Date().toISOString(),
      likesCount: inputPost.likesCount || 0,
      dislikesCount: inputPost.dislikesCount || 0,
      commentsCount: inputPost.commentsCount || 0,
      comments: Array.isArray(inputPost.comments) ? inputPost.comments : [],
      media: Array.isArray(inputPost.media) ? inputPost.media.map(m => m.URL || m.url) : [],
      privacy: inputPost.privacy || 'public'
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
  // Likes handling will need to be updated once backend supports it
  const hasLiked = false;

  // Author data access with fallbacks from backend format
  const firstName = author.first_name || author.firstName || 'Unknown';
  const lastName = author.last_name || author.lastName || 'User';
  const authorName = author.nickname || `${firstName} ${lastName}`;

  const formattedDate = formatDistanceToNow(new Date(normalizedPost.createdAt), { addSuffix: true });

  const handleLike = () => {
    if (typeof toggleLike === 'function') {
      toggleLike(normalizedPost.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?') && typeof deletePost === 'function') {
      deletePost(normalizedPost.id);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim() && typeof addComment === 'function') {
      addComment(normalizedPost.id, commentText);
      setCommentText('');
    }
  };

  const renderComments = () => {
    if (normalizedPost.comments.length === 0) {
      return <p className="text-sm text-gray-500 p-4">No comments yet.</p>;
    }

    return (
      <div className="space-y-4 p-4">
        {normalizedPost.comments.map((comment) => {
          // Get comment author with fallbacks
          const getCommentAuthor = () => {
            if (!comment.authorId) return null;

            let commentAuthor = getUserById(comment.authorId);
            if (!commentAuthor) {
              return {
                firstName: 'Anonymous',
                lastName: 'User',
                avatar: null
              };
            }
            return commentAuthor;
          };

          const commentAuthor = getCommentAuthor();
          const commentAuthorName = commentAuthor?.nickname ||
            `${commentAuthor?.firstName || 'Anonymous'} ${commentAuthor?.lastName || 'User'}`;

          return (
            <div key={comment.id || Math.random().toString(36).substring(2)} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={commentAuthor?.avatar} alt={commentAuthorName} />
                <AvatarFallback>
                  {commentAuthor?.firstName?.[0] || 'A'}{commentAuthor?.lastName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="font-medium">{commentAuthorName}</div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {comment.createdAt ?
                    formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) :
                    'Recently'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
                <AvatarImage src={author.avatar} alt={authorName} />
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
          <p className="whitespace-pre-wrap">{normalizedPost.content}</p>

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
                      className={`w-full h-full object-cover ${aspectRatio} transition-transform group-hover:scale-105`}
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

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>
              {normalizedPost.likesCount > 0 ?
                `${normalizedPost.likesCount} ${normalizedPost.likesCount === 1 ? 'like' : 'likes'}` : ''}
            </div>
            <div>
              {normalizedPost.commentsCount > 0 ?
                `${normalizedPost.commentsCount} ${normalizedPost.commentsCount === 1 ? 'comment' : 'comments'}` : ''}
            </div>
          </div>
        </CardContent>

        <div className={`border-t border-gray-200 ${isMobile ? 'border-x-0' : ''}`}>
          <div className="grid grid-cols-3 gap-1 py-1">
            <Button
              variant="ghost"
              className={`flex items-center justify-center ${hasLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`mr-1 h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              className="flex items-center justify-center"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="mr-1 h-5 w-5" />
              Comment
            </Button>
            <Button variant="ghost" className="flex items-center justify-center">
              <Share2 className="mr-1 h-5 w-5" />
              Share
            </Button>
          </div>
        </div>

        {showComments && (
          <CardFooter className="flex flex-col p-0">
            <div className={`border-t border-gray-200 w-full ${isMobile ? 'border-x-0' : ''}`}>
              {renderComments()}
            </div>

            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex items-center p-4 space-x-2 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.firstName} />
                  <AvatarFallback>{currentUser.firstName?.[0] || ''}{currentUser.lastName?.[0] || ''}</AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="rounded-full bg-gray-100"
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
