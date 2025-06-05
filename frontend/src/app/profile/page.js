'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Camera, Users, Image as ImageIcon, MapPin, Calendar, Lock, Globe, Mail, Cake, UserCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostCard from '@/components/post/PostCard';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostContext';
import { formatAvatarUrl } from '@/lib/utils';

const Profile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, getUserById, getAllUsers, loading: authLoading } = useAuth();
  const { getUserPosts } = usePosts();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract username from pathname if available
  useEffect(() => {
    // Check if we're on a specific user's profile or the current user's profile
    const pathParts = pathname.split('/');
    const username = pathParts.length > 2 ? pathParts[2] : null;

    if (username) {
      const foundUser = getAllUsers().find(
        u => `${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}` === username.toLowerCase()
      );

      if (foundUser) {
        setProfileUser(foundUser);
      } else {
        router.push('/not-found');
      }
    } else {
      setProfileUser(currentUser);
    }
    setIsLoading(false);
  }, [currentUser, pathname, router, getAllUsers]);

  // Modify the useEffect to only redirect after auth is loaded
  useEffect(() => {
    if (!authLoading && !currentUser) {  
      router.push('/login');
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
  const userPosts = getUserPosts(profileUser.id);
  const userFirstName = profileUser.first_name || profileUser.firstName;
  const userLastName = profileUser.last_name || profileUser.lastName;
  const userNickname = profileUser.nickname;
  const userEmail = profileUser.email;
  const userDateOfBirth = profileUser.date_of_birth || profileUser.dateOfBirth;
  const userCreatedAt = profileUser.created_at || profileUser.createdAt;
  const userAbout = profileUser.about_me || profileUser.about; // Use about_me from JSON

  const displayName = userNickname || (userFirstName && userLastName ? `${userFirstName} ${userLastName}`.trim() : '');

  const initials = userFirstName && userLastName
    ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase()
    : userNickname ? userNickname.substring(0, Math.min(2, userNickname.length)).toUpperCase() : '??';

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
              <AvatarImage src={formatAvatarUrl(profileUser.avatar)} alt={displayName} />
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
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center space-x-2 mt-1 text-gray-500">
              {profileUser.isPublic ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>
                {profileUser.isPublic ? 'Public Profile' : 'Private Profile'}
              </span>
            </div>

            {userAbout && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">About Me</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{userAbout}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm text-gray-600">
              {userFirstName && userLastName && (
                <div className="flex items-center">
                  <UserCircle2 className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>{userFirstName} {userLastName}</span>
                </div>
              )}
              {/* Display Nickname only if it's different from FirstName LastName or if FirstName/LastName are not available */}
              {userNickname && 
                ((userFirstName && userLastName && userNickname.toLowerCase() !== `${userFirstName} ${userLastName}`.trim().toLowerCase()) || 
                 (!userFirstName && !userLastName)) && (
                <div className="flex items-center">
                  <span className="font-semibold mr-1.5 text-gray-500">Nickname:</span>
                  <span>{userNickname}</span>
                </div>
              )}
              {userEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>{userEmail}</span>
                </div>
              )}
              {userDateOfBirth && (
                <div className="flex items-center">
                  <Cake className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>
                    Born {new Date(userDateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {userLocation && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>{userLocation}</span>
                </div>
              )}
              {userCreatedAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span>
                    Joined {new Date(userCreatedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            {isOwnProfile ? (
              <Button variant="outline">Edit Profile</Button>
            ) : (
              <Button className="bg-social hover:bg-social-dark">Add Friend</Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-8 mt-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">{profileUser.followers?.length || 0}</span> followers
            </div>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">{profileUser.following?.length || 0}</span> following
            </div>
          </div>
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">0</span> photos
            </div>
          </div>
        </div>
      </div>

      {/* Profile tabs */}
      <div className="mt-4">
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-sm rounded-lg p-1 w-full">
            <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
            <TabsTrigger value="photos" className="flex-1">Photos</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="posts" className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map(post => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
                  <p className="text-gray-500 mt-1">
                    {isOwnProfile
                      ? "When you create posts, they'll appear here."
                      : "This user hasn't posted anything yet."}
                  </p>

                  {isOwnProfile && (
                    <Button className="mt-4 bg-social hover:bg-social-dark">
                      Create Your First Post
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="about">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">About {profileUser.firstName}</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                    <p className="mt-1">
                      {profileUser.about || 'No bio provided yet.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Basic Info</h4>
                    <div className="mt-1 space-y-2">
                      <div className="flex">
                        <span className="w-32 text-gray-600">Name:</span>
                        <span>{profileUser.firstName} {profileUser.lastName}</span>
                      </div>
                      {profileUser.nickname && (
                        <div className="flex">
                          <span className="w-32 text-gray-600">Nickname:</span>
                          <span>{profileUser.nickname}</span>
                        </div>
                      )}
                      <div className="flex">
                        <span className="w-32 text-gray-600">Profile Type:</span>
                        <span>{profileUser.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="pt-4 mt-4 border-t">
                      <Button variant="outline">Edit Details</Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="friends">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Friends</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Friend list is empty.
                    {isOwnProfile && " Connect with other users to grow your network!"}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="photos">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Photos</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">No photos uploaded yet.</p>
                  {isOwnProfile && (
                    <Button className="mt-4">Upload Photos</Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
