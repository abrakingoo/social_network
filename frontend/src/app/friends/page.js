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

const Friends = () => {
  const router = useRouter();
  const { currentUser, getAllUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }

    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users.");
      } finally {
        setTimeout(function () {
          setLoading(false);
        }, 5000);
      }
    };
    fetchUsers();
  }, [currentUser, router, getAllUsers]);

  if (loading) {
    <div className="flex justify-center items-center">
      <FadeLoader />
    </div>;
  }

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  // Mock friends data
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
      title: "Friend request accepted",
      description: "You are now friends!",
    });
  };

  // Handle rejecting a friend request
  const handleRejectFriend = (friendId) => {
    toast({
      title: "Friend request rejected",
      description: "The friend request has been rejected.",
    });
  };

  // Handle sending a friend request
  const handleAddFriend = (friendId) => {
    toast({
      title: "Friend request sent",
      description: "Your friend request has been sent.",
    });
  };

  // Filter friends based on the active tab
  const filteredFriends = mockFriends.filter((friend) => {
    if (searchQuery) {
      const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase();
      if (!fullName.includes(searchQuery.toLowerCase())) return false;
    }

    if (activeTab === "all") return true;
    if (activeTab === "requests" && friend.status === "pending") return true;
    if (activeTab === "suggestions") return false;
    return friend.status === "accepted";
  });

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends"
              className="pl-10"
            />
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="all">All Friends</TabsTrigger>
              <TabsTrigger value="requests">Friend Requests</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="sent">Sent Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstName[0]}
                          {friend.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {friend.firstName} {friend.lastName}
                        </h3>
                        {friend.mutual > 0 && (
                          <p className="text-sm text-gray-500">
                            {friend.mutual} mutual friends
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {friend.status === "pending" ? (
                        <>
                          <Button
                            onClick={() => handleAcceptFriend(friend.id)}
                            className="bg-social hover:bg-social-dark"
                            size="sm"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectFriend(friend.id)}
                            variant="outline"
                            size="sm"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      ) : friend.status === "requested" ? (
                        <Button variant="outline" size="sm">
                          Requested
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No friends found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery
                      ? `No friends matching "${searchQuery}"`
                      : "You don't have any friends yet"}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {mockFriends.filter((f) => f.status === "pending").length > 0 ? (
                mockFriends
                  .filter((f) => f.status === "pending")
                  .map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>
                            {friend.firstName[0]}
                            {friend.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {friend.firstName} {friend.lastName}
                          </h3>
                          {friend.mutual > 0 && (
                            <p className="text-sm text-gray-500">
                              {friend.mutual} mutual friends
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAcceptFriend(friend.id)}
                          className="bg-social hover:bg-social-dark"
                          size="sm"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectFriend(friend.id)}
                          variant="outline"
                          size="sm"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-10">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No friend requests</h3>
                  <p className="text-gray-500 mt-1">
                    You don't have any pending friend requests
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {userSuggestions.length > 0 ? (
                userSuggestions.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Suggested for you
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddFriend(user.id)}
                      className="bg-social hover:bg-social-dark"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">
                    No suggestions available
                  </h3>
                  <p className="text-gray-500 mt-1">
                    We don't have any suggestions for you at the moment
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {mockFriends.filter((f) => f.status === "requested").length >
              0 ? (
                mockFriends
                  .filter((f) => f.status === "requested")
                  .map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>
                            {friend.firstName[0]}
                            {friend.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {friend.firstName} {friend.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">Request sent</p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Cancel Request
                      </Button>
                    </div>
                  ))
              ) : (
                <div className="text-center py-10">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No sent requests</h3>
                  <p className="text-gray-500 mt-1">
                    You haven't sent any friend requests yet
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Friends;
