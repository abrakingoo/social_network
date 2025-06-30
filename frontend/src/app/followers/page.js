"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { API_BASE_URL, useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, UserCheck, UserX } from "lucide-react";
import { FadeLoader } from "react-spinners";
import { webSocketOperations } from "@/utils/websocket";
import UserProfileModal from "@/components/profile/UserProfileModal";
import Loading from "@/components/ui/loading";

const Followers = () => {
  const router = useRouter();
  const { currentUser, getAllUsers, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "followers";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Redirect to login if not authenticated
  const fetchUsers = async () => {
    try {
      const req = await fetch(`${API_BASE_URL}/api/users`, {
        method: "get",
        credentials: "include",
      });
      if (!req.ok) {
        setError("Failed to load users");
        return;
      }

      const data = await req.json();
      setUsers(data.message);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setTimeout(function () {
        setLoading(false);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!authLoading && !currentUser == null) {
      router.push("/login");
    }

    fetchUsers();
  }, [currentUser, router, getAllUsers]);

  if (loading) {
    <div className="flex justify-center items-center">
      <FadeLoader />
    </div>;
  }

  if (error) return <div>{error}</div>;

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  // Handle accepting a friend request
  const handleAcceptFriend = async (friendId) => {
    const res = await webSocketOperations.respondToFollowRequest(
      friendId,
      "accepted",
    );
    if (res.success) {
      setUsers([]);
      fetchUsers();
      toast({
        title: "Request accepted",
        description: "You are now friends!",
      });
    }
  };

  // Navigate to messages
  const navigateToMsg = () => {
    router.push(`/messages`);
  };

  const handleUnfollowAUser = async (userID) => {
    const res = await webSocketOperations.unfollowUser(userID);
    if (res.success) {
      setUsers([]);
      fetchUsers();
      toast({
        title: "Follow request rejected",
        description: "The follow request has been rejected.",
      });
    }
  };

  // Handle rejecting a friend request
  const handleRejectFriend = async (friendId) => {
    const res = await webSocketOperations.respondToFollowRequest(
      friendId,
      "declined",
    );
    if (res.success) {
      setUsers([]);
      fetchUsers();
      toast({
        title: "Follow request rejected",
        description: "The follow request has been rejected.",
      });
    }
  };

  // Handle sending a friend request
  const handleAddFriend = (friendId) => {
    const result = webSocketOperations.sendFollowRequest(friendId);
    setUsers([]);
    fetchUsers();
    toast({
      title: "Friend request sent",
      description: "Your friend request has been sent.",
    });
  };

  // Handle canceling a follow request
  const handleCancelFollowRequest = (followerId) => {
    const result = webSocketOperations.cancelFollowRequest(followerId);
    setUsers([]);
    fetchUsers([]);
    toast({
      title: "Success",
      description: "The follow request has been cancelled sucessfully.",
    });
  };

  // Handle user profile click
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  // Filter friends based on the active tab
  const filteredFriends = users.followers
    ? users.followers.filter((user) => {
        // Example: Assuming each user has firstName and lastName
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();

        // Check search query
        if (searchQuery) {
          if (!fullName.includes(searchQuery.toLowerCase())) return false;
        }

        // Apply tab-based filtering
        if (activeTab === "followers") return true;
        if (activeTab === "following") return true;
        if (activeTab === "requests" && user.status === "pending") return true;
        if (activeTab === "suggestions") return false; // or customize as needed
        return user.status === "accepted"; // default condition
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Followers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search followers"
              className="pl-10"
            />
          </div>

          <Tabs
            defaultValue="followers"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-5 w-full mb-6">
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="sent">Sent Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="space-y-4">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstname[0]}
                          {friend.lastname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {friend.firstname} {friend.lastname}
                        </h3>
                        {friend.mutual > 0 && (
                          <p className="text-sm text-gray-500">
                            {friend.mutual} mutual friends
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToMsg()}
                        >
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No followers found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery
                      ? `No follower matching "${searchQuery}"`
                      : "You don't have any followers yet"}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Following */}
            <TabsContent value="following" className="space-y-4">
              {users.following != null ? (
                users.following.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstname[0]}
                          {friend.lastname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {friend.firstname} {friend.lastname}
                        </h3>
                        {friend.mutual > 0 && (
                          <p className="text-sm text-gray-500">
                            {friend.mutual} mutual friends
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToMsg()}
                          >
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnfollowAUser(friend.id)}
                          >
                            Unfollow
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No following found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery
                      ? `No following matching "${searchQuery}"`
                      : "You don't have any followers yet"}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {users.received_request ? (
                users.received_request.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.firstname[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{friend.firstname}</h3>
                        {friend.mutual > 0 && (
                          <p className="text-sm text-gray-500">
                            {friend.mutual} mutual friends
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
              {users.non_mutual != null ? (
                users["non_mutual"].map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.firstname[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {user.firstname} {user.lastname}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Suggested for you
                        </p>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => handleAddFriend(user.id)}
                        className="bg-social hover:bg-social-dark"
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Friend
                      </Button>
                    </div>
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
              {users.sent_request != null ? (
                users.sent_request.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.firstname[0]}
                          {friend.lastname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {friend.firstname} {friend.lastname}
                        </h3>
                        <p className="text-sm text-gray-500">Request sent</p>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelFollowRequest(friend.id)}
                      >
                        Cancel Request
                      </Button>
                    </div>
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

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleModalClose}
        user={selectedUser}
      />
    </div>
  );
};

export default function FollowersContent() {
  return (
    <Suspense fallback={<Loading />}>
      <Followers />
    </Suspense>
  );
}
