
import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Camera, Users, Image as ImageIcon, MapPin, Calendar, Lock, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/post/PostCard';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostContext';

const Profile = () => {
  const { username } = useParams();
  const { currentUser, getUserById, getAllUsers } = useAuth();
  const { getUserPosts } = usePosts();
  const [activeTab, setActiveTab] = useState('posts');

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If username is provided, find that user, otherwise show current user's profile
  const profileUser = username
    ? getAllUsers().find(u => `${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}` === username.toLowerCase())
    : currentUser;

  if (!profileUser) {
    return <Navigate to="/not-found" replace />;
  }

  const isOwnProfile = currentUser.id === profileUser.id;
  const userPosts = getUserPosts(profileUser.id);
  const displayName = profileUser.nickname || `${profileUser.firstName} ${profileUser.lastName}`;

  return (
    <div className="min-h-screen bg-social-gray">
      <Navbar />

      <div className="container mx-auto px-4">
        {/* Cover photo */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-lg overflow-hidden">
            {/* This would be a cover photo in a real app */}
            <div className="h-full flex items-center justify-center">
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm"
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
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profileUser.avatar} alt={displayName} />
                <AvatarFallback>{profileUser.firstName[0]}{profileUser.lastName[0]}</AvatarFallback>
              </Avatar>

              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-100"
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

              {profileUser.about && (
                <p className="mt-3 text-gray-700">{profileUser.about}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {profileUser.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profileUser.location}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Joined {new Date().getFullYear()}</span>
                </div>
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
    </div>
  );
};

export default Profile;
