"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, UserCheck, UserX } from "lucide-react";
import { FadeLoader } from "react-spinners";

const Followers = () => {
  const router = useRouter();
  const { currentUser, getAllUsers, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: Proper authentication and data fetching
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !currentUser) {
      router.push("/login");
      return;
    }

    // Fetch users only if authenticated
    if (currentUser) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const allUsers = await getAllUsers();
          setUsers(allUsers || []);
        } catch (err) {
          console.error("Failed to fetch users:", err);
          setError("Failed to load users.");
          toast({
            title: "Error",
            description: "Failed to load users. Please try again.",
            variant: "destructive",
          });
        } finally {
          // CRITICAL FIX: Set loading to false immediately, NO DELAY!
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [currentUser, authLoading, router, getAllUsers, toast]);

  // FIXED: Proper loading state with RETURN STATEMENT
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FadeLoader />
      </div>
    );
  }

  // FIXED: Proper error handling
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // FIXED: Don't render if user is not authenticated
  if (!authLoading && !currentUser) {
    return null;
  }

  // Mock friends data (this should come from your API in real implementation)
  const mockFriends = [
    {
      id: "101",
      firstName: "John",
      lastName: "Doe",
      avatar: null,
      status: "accepted", // 'accepted', 'pending', 'requested'
      mutual: 5,
    },
    {
      id: "102",
      firstName: "Jane",
      lastName: "Smith",
      avatar: null,
      status: "accepted",
      mutual: 3,
    },
    {
      id: "103",
      firstName: "Mike",
      lastName: "Johnson",
      avatar: null,
      status: "pending",
      mutual: 2,
    },
    {
      id: "104",
      firstName: "Sarah",
      lastName: "Wilson",
      avatar: null,
      status: "requested",
      mutual: 1,
    },
  ];

  // Mock suggestions based on users
  const userSuggestions = users
    ? users
        .filter(
          (user) =>
            user.id !== currentUser.id &&
            !mockFriends.find((f) => f.id === user.id),
        )
        .slice(0, 5)
    : [];

  // Handle accepting a friend request
  const handleAcceptFriend = (friendId) => {
    toast({
      title: "Request accepted",
      description: "You are now friends!",
    });
  };

  // Handle declining a friend request
  const handleDeclineFriend = (friendId) => {
    toast({
      title: "Request declined",
      description: "Friend request declined.",
    });
  };

  // Handle sending a friend request
  const handleSendRequest = (userId) => {
    toast({
      title: "Request sent",
      description: "Friend request sent successfully!",
    });
  };

  // Filter friends based on search query
  const filteredFriends = mockFriends.filter(
    (friend) =>
      friend.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter suggestions based on search query
  const filteredSuggestions = userSuggestions.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Friends & Followers
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({mockFriends.length})</TabsTrigger>
              <TabsTrigger value="friends">
                Friends ({mockFriends.filter(f => f.status === 'accepted').length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({mockFriends.filter(f => f.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({userSuggestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="space-y-4">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>
                            {friend.firstName[0]}{friend.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {friend.firstName} {friend.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {friend.mutual} mutual friends
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {friend.status === 'accepted' && (
                          <Button variant="outline" size="sm">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Friends
                          </Button>
                        )}
                        {friend.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptFriend(friend.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineFriend(friend.id)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </>
                        )}
                        {friend.status === 'requested' && (
                          <Button variant="outline" size="sm" disabled>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Requested
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No friends found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? "Try a different search term" : "Start connecting with people!"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              <div className="space-y-4">
                {filteredFriends.filter(f => f.status === 'accepted').map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstName[0]}{friend.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {friend.mutual} mutual friends
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="space-y-4">
                {filteredFriends.filter(f => f.status === 'pending').map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstName[0]}{friend.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {friend.mutual} mutual friends
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptFriend(friend.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineFriend(friend.id)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="space-y-4">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.firstName?.[0] || user.nickname?.[0] || '?'}
                            {user.lastName?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.nickname || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Suggested for you
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No suggestions</h3>
                    <p className="text-gray-500">
                      Check back later for friend suggestions!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Followers;