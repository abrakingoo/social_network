"use client";

import React, { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Info, MessageCircle, Loader2 } from "lucide-react";
import PostForm from "@/components/post/PostForm";
import PostCard from "@/components/post/PostCard";
import GroupChat from "@/components/group/GroupChat";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const GroupContent = ({
  groupData,
  rsvpStatus,
  isRefreshingEvents,
  onCreateEvent,
  onRSVP,
  onUpdateGroupData, // Add callback to update group data
}) => {
  const { currentUser } = useAuth();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const formatEventDate = (dateString, time) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return time ? `${formattedDate}, ${time}` : formattedDate;
  };

  // Group-specific like handler
  const handleGroupPostLike = useCallback(
    async (postId) => {
      if (!currentUser) {
        toast.error("You must be logged in to like a post.");
        return;
      }

      // Find the post in group data
      const postIndex = groupData.group_post?.findIndex(
        (post) => post.id === postId,
      );
      if (postIndex === -1) return;

      const post = groupData.group_post[postIndex];
      const wasLiked = post.likedByCurrentUser || post.is_liked;

      // Optimistic UI update
      const updatedPosts = [...groupData.group_post];
      updatedPosts[postIndex] = {
        ...post,
        likedByCurrentUser: !wasLiked,
        likesCount: wasLiked
          ? (post.likesCount || post.likes_count || 0) - 1
          : (post.likesCount || post.likes_count || 0) + 1,
      };

      // Update group data immediately
      if (onUpdateGroupData) {
        onUpdateGroupData({
          ...groupData,
          group_post: updatedPosts,
        });
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/likePost`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: postId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to like post: ${response.status}`,
          );
        }
      } catch (error) {
        toast.error(`Error: ${error.message}`);
        // Revert on error
        if (onUpdateGroupData) {
          onUpdateGroupData(groupData);
        }
      }
    },
    [currentUser, groupData, onUpdateGroupData, API_BASE_URL],
  );

  // Group-specific comment like handler
  const handleGroupCommentLike = useCallback(
    async (postId, commentId) => {
      if (!currentUser) {
        toast.error("You must be logged in to like a comment.");
        return;
      }

      // Find the post and comment
      const postIndex = groupData.group_post?.findIndex(
        (post) => post.id === postId,
      );
      if (postIndex === -1) return;

      const post = groupData.group_post[postIndex];
      const commentIndex = post.comments?.findIndex(
        (comment) => comment.id === commentId,
      );
      if (commentIndex === -1) return;

      const comment = post.comments[commentIndex];
      const wasLiked = comment.likedByCurrentUser || comment.is_liked;

      // Optimistic UI update
      const updatedPosts = [...groupData.group_post];
      updatedPosts[postIndex] = {
        ...post,
        comments: post.comments.map((c, index) =>
          index === commentIndex
            ? {
                ...c,
                likedByCurrentUser: !wasLiked,
                likesCount: wasLiked
                  ? (c.likesCount || c.likes_count || 0) - 1
                  : (c.likesCount || c.likes_count || 0) + 1,
              }
            : c,
        ),
      };

      // Update group data immediately
      if (onUpdateGroupData) {
        onUpdateGroupData({
          ...groupData,
          group_post: updatedPosts,
        });
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/likeComment`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment_id: commentId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to like comment: ${response.status}`,
          );
        }
      } catch (error) {
        toast.error(`Error: ${error.message}`);
        // Revert on error
        if (onUpdateGroupData) {
          onUpdateGroupData(groupData);
        }
      }
    },
    [currentUser, groupData, onUpdateGroupData, API_BASE_URL],
  );

  // Group-specific add comment handler
  const handleGroupAddComment = useCallback(
    async (postId, commentText, commentImages = []) => {
      if (!currentUser) {
        toast.error("You must be logged in to add a comment.");
        return false;
      }

      if (!commentText.trim()) {
        toast.error("Comment text is required");
        return false;
      }

      // Find the post in group data
      const postIndex = groupData.group_post?.findIndex(
        (post) => post.id === postId,
      );
      if (postIndex === -1) return false;

      const post = groupData.group_post[postIndex];

      // Create new comment with temporary ID
      const newComment = {
        id: `temp-${Date.now()}`,
        content: commentText.trim(),
        media: commentImages.map(img => URL.createObjectURL(img)), // Create preview URLs for optimistic update
        author: {
          id: currentUser.id,
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          nickname: currentUser.nickname,
          avatar: currentUser.avatar,
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        likedByCurrentUser: false,
      };

      // Optimistic UI update
      const updatedPosts = [...groupData.group_post];
      updatedPosts[postIndex] = {
        ...post,
        comments: [...(post.comments || []), newComment],
        commentsCount: (post.commentsCount || 0) + 1,
      };

      // Update group data immediately
      if (onUpdateGroupData) {
        onUpdateGroupData({
          ...groupData,
          group_post: updatedPosts,
        });
      }

      try {
        // Send comment to backend using FormData (backend expects multipart form data)
        const formData = new FormData();
        formData.append('post_id', postId);
        formData.append('content', commentText.trim());
        formData.append('comment_id', newComment.id);

        // Add images to FormData
        if (commentImages && commentImages.length > 0) {
          commentImages.forEach((image) => {
            formData.append('media', image);
          });
        }

        const response = await fetch(`${API_BASE_URL}/api/addComment`, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to add comment: ${response.status}`,
          );
        }

        return true;
      } catch (error) {
        toast.error(`Failed to add comment: ${error.message}`);
        // Revert optimistic update on failure
        if (onUpdateGroupData) {
          const revertedPosts = [...groupData.group_post];
          revertedPosts[postIndex] = {
            ...post,
            comments: (post.comments || []).filter(
              (c) => c.id !== newComment.id,
            ),
            commentsCount: (post.commentsCount || 1) - 1,
          };
          onUpdateGroupData({
            ...groupData,
            group_post: revertedPosts,
          });
        }
        return false;
      }
    },
    [currentUser, groupData, onUpdateGroupData, API_BASE_URL],
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="posts" className="w-full mb-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {groupData.is_joined && (
            <div className="mb-6">
              <PostForm groupId={groupData.group_id} />
            </div>
          )}

          {groupData.group_post && groupData.group_post.length > 0 ? (
            <div className="space-y-6">
              {groupData.group_post.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={handleGroupPostLike}
                  onToggleCommentLike={handleGroupCommentLike}
                  onAddComment={handleGroupAddComment}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-gray-500">
                Be the first to post in this group!
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <GroupChat groupId={groupData.group_id} groupData={groupData} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          {groupData.is_joined && (
            <div className="mb-6">
              <Button
                className="w-full bg-social hover:bg-social-dark"
                onClick={onCreateEvent}
                disabled={isRefreshingEvents}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isRefreshingEvents ? "Updating..." : "Create Event"}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {isRefreshingEvents && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-social mr-2" />
                <span className="text-sm text-gray-600">
                  Updating events...
                </span>
              </div>
            )}

            {groupData.Events && groupData.Events.length > 0 ? (
              groupData.Events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          {formatEventDate(event.event_time, "")}
                          {event.location && ` · ${event.location}`}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => onRSVP(event.id)}
                        className={
                          rsvpStatus[event.id]
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-social hover:bg-social-dark"
                        }
                      >
                        {rsvpStatus[event.id] ? "Going" : "RSVP"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{event.description}</p>

                    {event.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span className="font-medium mr-2">Location:</span>
                        {event.location}
                      </div>
                    )}

                    <div className="mt-3 flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        {event.attendees ? event.attendees.length : 0}
                        {(event.attendees ? event.attendees.length : 0) === 1
                          ? " person"
                          : " people"}{" "}
                        going
                      </Badge>

                      {rsvpStatus[event.id] && (
                        <Badge variant="outline" className="bg-green-50">
                          You're going
                        </Badge>
                      )}
                    </div>
                    {event.creator && event.creator.firstname && (
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span>
                          Created by {event.creator.firstname}{" "}
                          {event.creator.lastname}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                <p className="text-gray-500">
                  {groupData.is_joined
                    ? "Create the first event for this group!"
                    : "There are no scheduled events for this group yet"}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                About this group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {groupData.about || "No description available."}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">
                    {groupData.created_at
                      ? new Date(groupData.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Members:</span>
                  <p className="text-gray-600">
                    {groupData.members_count || groupData.members?.length || 0}
                  </p>
                </div>
                {groupData.Creator && groupData.Creator.firstname && (
                  <div>
                    <span className="font-medium">Creator:</span>
                    <p className="text-gray-600">
                      {groupData.Creator.firstname} {groupData.Creator.lastname}
                      {groupData.Creator.nickname &&
                        ` (${groupData.Creator.nickname})`}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Group rules</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Be kind and respectful to other members</li>
                  <li>No spam or self-promotion</li>
                  <li>Only share content relevant to the group's purpose</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupContent;
