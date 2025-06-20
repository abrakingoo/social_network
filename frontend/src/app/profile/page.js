"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import PostCardLightbox from "@/components/post/PostCardLightbox";
import {
  Camera,
  Users,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Lock,
  Globe,
  Mail,
  Cake,
  UserCircle2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCard from "@/components/post/PostCard";
import PostForm from "@/components/post/PostForm"; // Import PostForm component
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostContext";
import { formatAvatarUrl } from "@/lib/utils";

const Profile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    getUserById,
    getAllUsers,
    loading: authLoading,
  } = useAuth();
  const { getUserPosts } = usePosts();
  const [activeTab, setActiveTab] = useState("posts");
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false); // Add state for post form visibility
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0); // Add state for lightbox index

  // Function to handle successful post creation
  const handlePostCreated = () => {
    setShowPostForm(false); 
  };

  // Extract username from pathname if available
  useEffect(() => {
    // Check if we're on a specific user's profile or the current user's profile
    const pathParts = pathname.split("/");
    const username = pathParts.length > 2 ? pathParts[2] : null;

    if (username) {
      const foundUser = getAllUsers().find(
        (u) =>
          `${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}` ===
          username.toLowerCase(),
      );

      if (foundUser) {
        setProfileUser(foundUser);
      } else {
        router.push("/not-found");
      }
    } else {
      setProfileUser(currentUser);
      setIsLoading(false);
    }
  }, [currentUser, pathname, router, getAllUsers, authLoading]);

  // Modify the useEffect to only redirect after auth is loaded
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, router, authLoading]);

  // Modify the loading check to include auth loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render if currentUser is null and auth is done loading
  if (!authLoading && !currentUser) {
    return null;
  }

  // Don't render if profile user not found
  if (!profileUser) {
    return null;
  }

  const isOwnProfile = currentUser.id === profileUser.id;
  const userPosts = isOwnProfile && currentUser && currentUser.userposts ? currentUser.userposts : getUserPosts(profileUser.id);
  const userFirstName = profileUser.first_name || profileUser.firstName;
  const userLastName = profileUser.last_name || profileUser.lastName;
  const userNickname = profileUser.nickname;
  const userEmail = profileUser.email;
  const userDateOfBirth = profileUser.date_of_birth || profileUser.dateOfBirth;
  const userCreatedAt = profileUser.created_at || profileUser.createdAt;

  // Extract all photos from user's posts for the Photos tab
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const userPhotos = userPosts.flatMap(post => post.media || post.images || []).map(photo => {
    // Check if photo is an object with a URL property or a direct string
    const photoUrl = typeof photo === 'object' && photo.URL ? photo.URL : (typeof photo === 'object' && photo.url ? photo.url : photo);
    return `${API_BASE_URL}/${photoUrl}`;
  });

  const userAbout = profileUser.about_me || profileUser.about;
  const h1Name = userNickname || userFirstName || "";
  const subtitleName =
    userFirstName && userLastName
      ? `${userFirstName} ${userLastName}`.trim()
      : null; // For the subtitle
  const avatarAltName = userNickname || subtitleName || h1Name || "User"; // For Avatar alt

  const initials =
    userFirstName && userLastName
      ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase()
      : userNickname
        ? userNickname
            .substring(0, Math.min(2, userNickname.length))
            .toUpperCase()
        : "??";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover photo */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-lg overflow-hidden">
          {/* This would be a cover photo in a real app */}
          <div className="h-full flex items-center justify-center">
            {isOwnProfile && (
              <Button
                variant="secondary"
                className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm hover:bg-white/80"
              >
                <Camera className="h-4 w-4" />
                <span>Change Cover</span>
              </Button>
            )}
          </div>
        </div>

        {/* Profile picture and name */}
        <div className="absolute bottom-0 left-0 transform translate-y-1/2 ml-8">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg cursor-default">
              <AvatarImage
                src={formatAvatarUrl(profileUser.avatar)}
                alt={avatarAltName}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            {isOwnProfile && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-100"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="pt-20 pb-6 px-6 bg-white rounded-lg mt-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{h1Name}</h1>
            <div className="flex items-center space-x-2 mt-1 text-gray-500">
              {profileUser.is_public ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>
                {profileUser.is_public ? "Public Profile" : "Private Profile"}
              </span>
            </div>

            {userAbout && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  About Me
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {userAbout}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm text-gray-600">
              {userFirstName && userLastName && (
                <div className="flex items-center">
                  <UserCircle2 className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>
                    {userFirstName} {userLastName}
                  </span>
                </div>
              )}
              {userCreatedAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
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
          </div>

          <div>
            {isOwnProfile ? (
              <Button
                variant="outline"
                onClick={() => router.push("/settings")}
              >
                Edit Profile
              </Button>
            ) : (
              <Button className="bg-social hover:bg-social-dark">
                Add Friend
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-8 mt-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">
                {profileUser.followers?.length || 0}
              </span>{" "}
              followers
            </div>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">
                {profileUser.following?.length || 0}
              </span>{" "}
              following
            </div>
          </div>
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">{userPhotos.length}</span> photos
            </div>
          </div>
        </div>
      </div>

      {/* Profile tabs */}
      <div className="mt-4">
        <Tabs
          defaultValue="posts"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-white shadow-sm rounded-lg p-1 w-full">
            <TabsTrigger value="posts" className="flex-1">
              Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1">
              About
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="flex-1"
              onClick={() => router.push("/followers?tab=followers")}
            >
              Followers
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex-1">
              Photos
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="posts" className="space-y-4">
              {isOwnProfile && showPostForm && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
                    <PostForm onPostCreated={handlePostCreated} />
                  </Suspense>
                </div>
              )}
              {userPosts.length > 0 ? (
                userPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : !showPostForm && (
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
                  <p className="text-gray-500 mt-2">
                    {isOwnProfile
                      ? "When you create posts, they'll appear here."
                      : `${profileUser.firstName} hasn't posted anything yet.`}
                  </p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => {
                        // Toggle the visibility of the post form on the profile page
                        setShowPostForm(!showPostForm);
                      }}
                      className="mt-4 bg-social hover:bg-social-dark text-white"
                    >
                      Create your first post
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="about">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">
                  About {profileUser.firstName}
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                    <p className="mt-1">
                      {profileUser.about || "No bio provided yet."}
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
                          {profileUser.is_public ? (
                            <Globe className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          )}
                          Profile Type
                        </dt>
                        <dd className="w-2/3 text-sm text-gray-900">
                          {profileUser.is_public ? "Public" : "Private"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {isOwnProfile && (
                    <div className="pt-4 mt-4 border-t">
                      <Button variant="outline">Edit Details</Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="followers">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Followers</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Friend list is empty.
                    {isOwnProfile &&
                      " Connect with other users to grow your network!"}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="photos">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPhotos.length > 0 ? (
                    userPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt="User photo"
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setLightboxOpen(true);
                          setLightboxIndex(index);
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No photos uploaded yet.</p>
                      {isOwnProfile && (
                        <Button className="mt-4">Upload Photos</Button>
                      )}
                    </div>
                  )}
                </div>
                {/* Lightbox for photos */}
                <PostCardLightbox
                  open={lightboxOpen}
                  images={userPhotos}
                  index={lightboxIndex}
                  onClose={() => setLightboxOpen(false)}
                  onPrev={() => setLightboxIndex((prev) => (prev - 1 + userPhotos.length) % userPhotos.length)}
                  onNext={() => setLightboxIndex((prev) => (prev + 1) % userPhotos.length)}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
