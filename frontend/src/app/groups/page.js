"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { groupService } from "@/services/groupService";
import {
  webSocketOperations,
  useWebSocketNotifications,
} from "@/utils/websocket";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
} from "lucide-react";
import lodash from "lodash";
import { titleToSlug } from "@/lib/slugUtils"; // Import slug utility
import Loading from "@/components/ui/loading";

// Request states based on backend data
const REQUEST_STATES = {
  NOT_REQUESTED: "not_requested",
  PENDING: "pending",
  JOINED: "joined",
};

// Group card component for better reusability
const GroupCard = ({
  group,
  onRequestJoin,
  onLeave,
  isRequesting,
  requestState,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = group.user_role === "admin";
  const isMember = group.is_joined;

  // Convert group title to URL-safe slug
  const groupSlug = titleToSlug(group.title);

  // Determine the current request state for this group
  const currentRequestState =
    requestState[group.id] || REQUEST_STATES.NOT_REQUESTED;

  // Determine button state and text
  const getButtonState = () => {
    if (isAdmin) {
      return {
        text: "Manage Group",
        variant: "outline",
        action: "link",
        href: `/groups/${groupSlug}`,
      };
    }

    if (isMember || currentRequestState === REQUEST_STATES.JOINED) {
      return {
        text: "View Group",
        variant: "outline",
        action: "link",
        href: `/groups/${groupSlug}`,
      };
    }

    if (currentRequestState === REQUEST_STATES.PENDING) {
      return {
        text: "Request Pending",
        variant: "outline",
        action: "disabled",
        disabled: true,
      };
    }

    return {
      text: "Request to Join",
      variant: "default",
      action: "request",
      className: "bg-social hover:bg-social-dark",
    };
  };

  const buttonState = getButtonState();

  return (
    <Card className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-r from-social/20 to-social-accent/20"></div>
      <CardHeader className="relative pt-0">
        <div className="absolute -top-6 left-4">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarFallback className="bg-social text-white">
              {group.title.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="ml-16">
          {/* Updated link to use slug instead of ID */}
          <Link
            href={`/groups/${groupSlug}`}
            className="text-lg font-semibold hover:text-social"
          >
            {group.title}
          </Link>
          <p className="text-sm text-gray-500">{group.members_count} members</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">{group.about}</p>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-4">
        {buttonState.action === "link" ? (
          <Button variant={buttonState.variant} className="w-full" asChild>
            <Link href={buttonState.href}>
              {buttonState.text === "View Group" && (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {buttonState.text}
            </Link>
          </Button>
        ) : buttonState.action === "disabled" ? (
          <Button
            variant="outline"
            className="w-full border-orange-300 text-orange-700 bg-orange-50 cursor-not-allowed"
            disabled={true}
          >
            <Clock className="h-4 w-4 mr-2" />
            {buttonState.text}
          </Button>
        ) : (
          <Button
            className={`w-full ${buttonState.className}`}
            onClick={() => onRequestJoin(group.id)}
            disabled={isRequesting}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {buttonState.text}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const Groups = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [requestStates, setRequestStates] = useState({});

  // Enable WebSocket notifications for this component
  useWebSocketNotifications();

  // Determine request state for a group based on backend data
  const determineRequestState = (group, currentUser) => {
    if (group.is_joined) {
      return REQUEST_STATES.JOINED;
    }

    // Check if user has a pending join request
    if (group.user_join_request) {
      if (group.user_join_request.status === "pending") {
        return REQUEST_STATES.PENDING;
      } else if (group.user_join_request.status === "accepted") {
        return REQUEST_STATES.JOINED;
      } else if (group.user_join_request.status === "declined") {
        return REQUEST_STATES.NOT_REQUESTED;
      }
    }

    // Fallback: Check JoinRequest array for pending request
    if (group.JoinRequest && currentUser) {
      const userRequest = group.JoinRequest.find(
        (request) =>
          request.user_id === currentUser.id && request.status === "pending",
      );
      if (userRequest) {
        return REQUEST_STATES.PENDING;
      }
    }

    return REQUEST_STATES.NOT_REQUESTED;
  };

  // Listen for real-time group updates
  useEffect(() => {
    const handleGroupNotificationUpdate = (event) => {
      const { groupId, notification } = event.detail;

      if (notification.type === "membership_changed") {
        const { status } = notification.data;

        if (status === "accepted") {
          // Update the group's request state and membership status
          setGroups((prevGroups) =>
            prevGroups.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    is_joined: true,
                    user_join_request: group.user_join_request
                      ? { ...group.user_join_request, status: "accepted" }
                      : null,
                  }
                : group,
            ),
          );
          setRequestStates((prev) => ({
            ...prev,
            [groupId]: REQUEST_STATES.JOINED,
          }));
        } else if (status === "declined") {
          // Update the group's request state
          setGroups((prevGroups) =>
            prevGroups.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    is_joined: false,
                    user_join_request: group.user_join_request
                      ? { ...group.user_join_request, status: "declined" }
                      : null,
                  }
                : group,
            ),
          );
          setRequestStates((prev) => ({
            ...prev,
            [groupId]: REQUEST_STATES.NOT_REQUESTED,
          }));
        }
      }
      // Handle real-time leave group
      if (notification.type === "group_left") {
        if (notification.data.user_id === currentUser?.id) {
          setGroups((prevGroups) =>
            prevGroups.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    is_joined: false,
                    user_join_request: null,
                  }
                : group,
            ),
          );
          setRequestStates((prev) => ({
            ...prev,
            [groupId]: REQUEST_STATES.NOT_REQUESTED,
          }));
        }
      }
    };

    window.addEventListener(
      "groupNotificationUpdate",
      handleGroupNotificationUpdate,
    );

    return () => {
      window.removeEventListener(
        "groupNotificationUpdate",
        handleGroupNotificationUpdate,
      );
    };
  }, [currentUser?.id]);

  // Debounced search function
  const debouncedSearch = useCallback(
    lodash.debounce((query) => {
      fetchGroups({ search: query, filter: activeTab });
    }, 300),
    [activeTab],
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Fetch groups with pagination and filters
  const fetchGroups = async ({
    search = searchQuery,
    filter = activeTab,
  } = {}) => {
    if (!currentUser || authLoading) {
      return;
    }

    try {
      setLoading(true);

      const result = await groupService.getAllGroups({
        search,
        filter,
      });

      const groupsWithRequestStates = result.groups.map((group) => {
        const requestState = determineRequestState(group, currentUser);
        return { ...group, requestState };
      });

      setGroups(groupsWithRequestStates);

      // Update request states mapping
      const newRequestStates = {};
      groupsWithRequestStates.forEach((group) => {
        newRequestStates[group.id] = group.requestState;
      });
      setRequestStates(newRequestStates);

      // Update URL with current filters
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("tab", filter);
      router.push(`/groups?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error("[Groups.fetchGroups] Error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to load groups. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and tab change handler
  useEffect(() => {
    fetchGroups();
  }, [currentUser, authLoading]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchGroups({ filter: tab });
  };

  // Handle request to join group
  const handleRequestJoinGroup = async (groupId) => {
    try {
      setIsRequesting(true);

      // Optimistic update for better UX - update both request state and group data
      setRequestStates((prev) => ({
        ...prev,
        [groupId]: REQUEST_STATES.PENDING,
      }));

      // Also update the group's user_join_request field optimistically
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                user_join_request: {
                  id: "temp-" + Date.now(),
                  user_id: currentUser.id,
                  status: "pending",
                  created_at: new Date().toISOString(),
                  user: {
                    id: currentUser.id,
                    firstname: currentUser.firstname,
                    lastname: currentUser.lastname,
                    nickname: currentUser.nickname,
                    avatar: currentUser.avatar,
                  },
                },
              }
            : group,
        ),
      );
      toast({
        title: "Request Sent",
        description:
          "Your request to join has been sent to the group admin for approval!",
      });

      const result = await webSocketOperations.joinGroup(groupId);
    } catch (error) {
      // Revert optimistic update on error
      setRequestStates((prev) => ({
        ...prev,
        [groupId]: REQUEST_STATES.NOT_REQUESTED,
      }));

      // Also revert the group's user_join_request field
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, user_join_request: null } : group,
        ),
      );

      toast({
        title: "Error",
        description:
          error.message || "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle group leave (for members who want to leave)
  const handleLeaveGroup = async (groupId) => {
    try {
      setIsRequesting(true);

      // Optimistic update for better UX
      setRequestStates((prev) => ({
        ...prev,
        [groupId]: REQUEST_STATES.NOT_REQUESTED,
      }));
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, is_joined: false } : group,
        ),
      );

      const result = await webSocketOperations.leaveGroup(groupId);

      if (result.success) {
        toast({
          title: "Success",
          description: "You have left the group successfully.",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setRequestStates((prev) => ({
        ...prev,
        [groupId]: REQUEST_STATES.JOINED,
      }));
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, is_joined: true } : group,
        ),
      );

      toast({
        title: "Error",
        description:
          error.message || "Failed to leave group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    // Validate input
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    // Trim whitespace
    const trimmedName = newGroupName.trim();
    const trimmedDescription = newGroupDescription.trim();

    // Validate name length
    if (trimmedName.length < 3) {
      toast({
        title: "Error",
        description: "Group name must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    // Validate name format (alphanumeric and spaces only)
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
      toast({
        title: "Error",
        description: "Group name can only contain letters, numbers, and spaces",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const result = await groupService.createGroup({
        name: trimmedName,
        description: trimmedDescription,
      });

      if (result.success) {
        // Reset form and close dialog
        setNewGroupName("");
        setNewGroupDescription("");
        setIsCreateOpen(false);

        toast({
          title: "Success",
          description:
            result.message || `${trimmedName} has been created successfully!`,
        });

        // Convert group title to slug for redirect
        const groupSlug = titleToSlug(trimmedName);

        // Redirect to the new group using slug instead of ID
        router.push(`/groups/${groupSlug}`);
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to create group. Please try again.";
      const toastTitle =
        error.type === "DUPLICATE_GROUP_TITLE"
          ? "Group Already Exists"
          : "Error";

      toast({
        title: toastTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  // Don't render content if user is not authenticated (after loading)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-social hover:bg-social-dark">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateGroup}>
              <DialogHeader>
                <DialogTitle>Create a New Group</DialogTitle>
                <DialogDescription>
                  Fill in the details to create your own group community.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Group Name*</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                    disabled={isCreating}
                    maxLength={100}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="What is your group about?"
                    rows={4}
                    disabled={isCreating}
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-social hover:bg-social-dark"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search groups"
          className="pl-10"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="joined">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-social" />
            </div>
          ) : groups.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onRequestJoin={handleRequestJoinGroup}
                    onLeave={handleLeaveGroup}
                    isRequesting={isRequesting}
                    requestState={requestStates}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No groups found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery
                  ? `No groups matching "${searchQuery}"`
                  : activeTab === "joined"
                    ? "You haven't joined any groups yet"
                    : activeTab === "discover"
                      ? "No groups available to discover"
                      : "There are no groups available right now"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function GroupsContent() {
  return (
    <Suspense fallback={<Loading />}>
      <Groups />
    </Suspense>
  );
}
