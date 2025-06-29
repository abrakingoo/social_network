"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/post/PostCard";
import { usePosts } from "@/context/PostContext";
import { formatAvatarUrl } from "@/lib/utils";
import {
  Users,
  Image as ImageIcon,
  Calendar,
  Lock,
  Globe,
  Mail,
  Cake,
  UserCircle2,
} from "lucide-react";

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState("posts");
  const { getUserPosts } = usePosts();
  const [userPosts, setUserPosts] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);
  const [completeUserData, setCompleteUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch complete user data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      fetchCompleteUserData();
    }
  }, [user, isOpen]);

  const fetchCompleteUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/getProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.status);
        // Fallback to the basic user data
        setCompleteUserData(user);
        return;
      }

      const data = await response.json();
      setCompleteUserData(data.message);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to the basic user data
      setCompleteUserData(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (completeUserData && isOpen) {
      // Get posts for the user
      const posts = getUserPosts(completeUserData.id);
      setUserPosts(posts);

      // Extract photos from posts
      const photos = posts
        .flatMap((post) => post.media || post.images || [])
        .map((photo) => {
          const photoUrl =
            typeof photo === "object" && photo.URL
              ? photo.URL
              : typeof photo === "object" && photo.url
                ? photo.url
                : photo;
          return `${API_BASE_URL}/${photoUrl}`;
        });
      setUserPhotos(photos);
    }
  }, [completeUserData, isOpen, getUserPosts]);

  // Use completeUserData if available, otherwise fall back to the basic user data
  const displayUser = completeUserData || user;

  if (!displayUser) return null;

  const userFirstName = displayUser.first_name || displayUser.firstName || displayUser.firstname;
  const userLastName = displayUser.last_name || displayUser.lastName || displayUser.lastname;
  const userNickname = displayUser.nickname;
  const userEmail = displayUser.email;
  const userDateOfBirth = displayUser.date_of_birth || displayUser.dateOfBirth;
  const userCreatedAt = displayUser.created_at || displayUser.createdAt;
  const userAbout = displayUser.about_me || displayUser.about;

  const h1Name = userNickname || userFirstName || "";
  const subtitleName =
    userFirstName && userLastName
      ? `${userFirstName} ${userLastName}`.trim()
      : null;

  const initials =
    userFirstName && userLastName
      ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase()
      : userNickname
        ? userNickname
            .substring(0, Math.min(2, userNickname.length))
            .toUpperCase()
        : "??";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={formatAvatarUrl(displayUser.avatar)}
                alt={subtitleName || h1Name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">{h1Name}</h2>
              {subtitleName && (
                <p className="text-gray-600">{subtitleName}</p>
              )}
              
              <div className="flex items-center justify-center space-x-2 mt-2 text-gray-500">
                {displayUser.isPublic !== undefined ? displayUser.isPublic : displayUser.is_public ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {displayUser.isPublic !== undefined ? displayUser.isPublic : displayUser.is_public
                    ? "Public Profile"
                    : "Private Profile"}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm">
                  <span className="font-semibold">
                    {displayUser.followers?.length || 0}
                  </span>{" "}
                  followers
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm">
                  <span className="font-semibold">
                    {displayUser.following?.length || 0}
                  </span>{" "}
                  following
                </span>
              </div>
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm">
                  <span className="font-semibold">{userPhotos.length}</span> photos
                </span>
              </div>
            </div>

            {/* Date Joined */}
            {userCreatedAt && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Joined{" "}
                  {new Date(userCreatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* About section if available */}
          {userAbout && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                About Me
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {userAbout}
              </p>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            defaultValue="posts"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="posts" className="space-y-4">
                {loading ? (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading posts...</p>
                  </div>
                ) : userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700">
                      No posts yet
                    </h3>
                    <p className="text-gray-500 mt-2">
                      {userFirstName} hasn't posted anything yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">
                    About {userFirstName}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                      <p className="mt-1">
                        {userAbout || "No bio provided yet."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">
                        Basic Info
                      </h4>
                      <dl className="divide-y divide-gray-200">
                        {userFirstName && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <UserCircle2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              First Name
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {userFirstName}
                            </dd>
                          </div>
                        )}
                        {userLastName && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <UserCircle2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              Last Name
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {userLastName}
                            </dd>
                          </div>
                        )}
                        {userNickname && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <UserCircle2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              Nickname
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {userNickname}
                            </dd>
                          </div>
                        )}
                        {userEmail && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              Email
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {userEmail}
                            </dd>
                          </div>
                        )}
                        {userDateOfBirth && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <Cake className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              Date of Birth
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {new Date(userDateOfBirth).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </dd>
                          </div>
                        )}
                        {userCreatedAt && (
                          <div className="py-3 flex items-center">
                            <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              Joined
                            </dt>
                            <dd className="w-2/3 text-sm text-gray-900">
                              {new Date(userCreatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </dd>
                          </div>
                        )}
                        <div className="py-3 flex items-center">
                          <dt className="w-1/3 text-sm font-medium text-gray-500 flex items-center">
                            {displayUser.isPublic !== undefined ? displayUser.isPublic : displayUser.is_public ? (
                              <Globe className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            )}
                            Profile Type
                          </dt>
                          <dd className="w-2/3 text-sm text-gray-900">
                            {displayUser.isPublic !== undefined ? displayUser.isPublic : displayUser.is_public ? "Public" : "Private"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPhotos.length > 0 ? (
                      userPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt="User photo"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No photos uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal; 