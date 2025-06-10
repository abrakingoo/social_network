'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/services/groupService'; // Import groupService
import PostForm from '@/components/post/PostForm';
import PostCard from '@/components/post/PostCard';
import EventForm from '@/components/group/EventForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, Settings, Info, UserPlus, Trash2, Loader2 } from 'lucide-react'; // Add Trash2 and Loader2
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

const GroupDetail = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id;
  const { currentUser, loading: authLoading } = useAuth(); // Get authLoading
  const { toast } = useToast();
  const [groupData, setGroupData] = useState(null); // State for real group data
  const [isLoadingDetails, setIsLoadingDetails] = useState(true); // Loading state for details
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for deletion
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState({});

  // Remove mock group data and mock posts
  // const [mockGroup, setMockGroup] = useState({ ... });
  // const mockPosts = [ ... ];

  // Fetch group details on component mount
  useEffect(() => {
    let isMounted = true; // For cleanup

    const fetchGroupDetails = async () => {
      if (!currentUser || authLoading) {
        console.log('[GroupDetail] Skipping fetch - auth not ready:', { currentUser, authLoading });
        return;
      }

      console.log('[GroupDetail] Starting to fetch group details for ID:', groupId);
      setIsLoadingDetails(true);
      try {
        // 1. Fetch all groups to get the title by ID (workaround)
        console.log('[GroupDetail] Fetching all groups to find title for ID:', groupId);
        const allGroups = await groupService.getAllGroups();
        if (!isMounted) return; // Don't update state if component unmounted

        console.log('[GroupDetail] All groups fetched:', allGroups);

        const currentGroup = allGroups.find(group => group.id === groupId);
        console.log('[GroupDetail] Found current group:', currentGroup);

        if (currentGroup) {
          // 2. Fetch detailed group data using the title
          console.log('[GroupDetail] Fetching details for group title:', currentGroup.title);
          const details = await groupService.getGroupDetails(currentGroup.title);
          if (!isMounted) return; // Don't update state if component unmounted

          console.log('[GroupDetail] Group details fetched:', details);

          // Determine the current user's role and membership status in this group
          let userRole = '';
          let isJoined = false;

          if (currentUser) {
            const memberInfo = details.members.find(member => member.id === currentUser.id);
            if (memberInfo) {
              isJoined = true;
              userRole = memberInfo.role;
            }
          }

          // Augment groupData with user-specific info
          setGroupData({
            ...details,
            is_joined: isJoined,
            user_role: userRole,
            events: details.Events, // Ensure events is populated correctly
          });
        } else {
          console.error('[GroupDetail] Group not found for ID:', groupId);
          if (!isMounted) return;
          toast({
            title: "Error",
            description: "Group not found.",
            variant: "destructive"
          });
          router.push('/groups'); // Redirect if group not found
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[GroupDetail] Error in fetchGroupDetails:', {
          error,
          message: error.message,
          status: error.status,
          stack: error.stack
        });
        toast({
          title: "Error",
          description: "Failed to load group details. Please try again.",
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchGroupDetails();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [groupId, currentUser, authLoading]); // Removed router and toast from dependencies

  // Separate effect for auth redirect
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Don't render if auth is still loading or user not authenticated
  if (authLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  // Show loading spinner if group details are being fetched
  if (isLoadingDetails || !groupData) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  const formatEventDate = (dateString, time) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    return time ? `${formattedDate}, ${time}` : formattedDate;
  };

  // Handle joining/leaving group (stubbed as per Phase 1)
  const handleJoinLeaveGroup = (isJoined) => {
    toast({
      title: isJoined ? "Leave Group" : "Join Group",
      description: isJoined ? "Leaving group functionality will be available soon!" : "Joining group functionality will be available soon!",
    });
  };

  // Placeholder for RSVP functionality
  const handleRSVP = (eventId) => {
    setRsvpStatus(prevStatus => ({
      ...prevStatus,
      [eventId]: !prevStatus[eventId] // Toggle RSVP status locally
    }));
    toast({
      title: "RSVP Status Updated",
      description: rsvpStatus[eventId] ? "You have un-RSVP'd for this event." : "You have successfully RSVP'd for this event!",
    });
  };

  // Handle group deletion
  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await groupService.deleteGroup(groupData.title);
      toast({
        title: "Group Deleted",
        description: `${groupData.title} has been successfully deleted.`,
      });
      router.push('/groups'); // Redirect to groups list after deletion
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEventCreated = (newEvent) => {
    // Assuming newEvent comes in a format ready to be added to groupData.events
    setGroupData(prevGroupData => ({
      ...prevGroupData,
      events: [newEvent, ...(prevGroupData.events || [])] // Ensure events is an array
    }));
    setIsCreateEventOpen(false);
  };

  return (
            <div className="max-w-4xl mx-auto">
              {/* Group Header */}
              <Card className="mb-6 overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-social/30 to-social-accent/30 relative">
                  {groupData.user_role === 'admin' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-4 right-4"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit Cover
                    </Button>
                  )}
                </div>
                <CardHeader className="relative pt-0">
                  <div className="absolute -top-12 left-6">
                    <Avatar className="h-24 w-24 border-4 border-white">
                      <AvatarFallback className="text-3xl bg-social text-white">
                        {groupData.title.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-28 flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{groupData.title}</CardTitle>
                      <CardDescription>
                        {groupData.members_count} members · Created {new Date(groupData.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>

                    {groupData.user_role === 'admin' ? (
                      <div className="flex space-x-2">
                        <Button className="bg-social hover:bg-social-dark">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Group
                        </Button>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Group
                        </Button>
                      </div>
                    ) : groupData.is_joined ? (
                      <Button variant="outline" onClick={() => handleJoinLeaveGroup(true)}>Leave Group</Button>
                    ) : (
                      <Button
                        className="bg-social hover:bg-social-dark"
                        onClick={() => handleJoinLeaveGroup(false)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Group
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{groupData.about}</p>
                </CardContent>
              </Card>

              {/* Group Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2">
                  <Tabs defaultValue="posts" className="w-full mb-6">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="posts">Posts</TabsTrigger>
                      <TabsTrigger value="events">Events</TabsTrigger>
                      <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-6">
                      {/* Posts content - keep existing code */}
                      {groupData.is_joined && (
                        <div className="mb-6">
                          <PostForm groupId={groupId} />
                        </div>
                      )}

                      {groupData.group_posts && groupData.group_posts.length > 0 ? (
                        <div className="space-y-6">
                          {groupData.group_posts.map((post) => (
                            <PostCard key={post.id} post={post} />
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

                    <TabsContent value="events" className="mt-6">
                      {groupData.user_role === 'admin' && (
                        <div className="mb-6">
                          <Button
                            className="w-full bg-social hover:bg-social-dark"
                            onClick={() => setIsCreateEventOpen(true)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Event
                          </Button>
                        </div>
                      )}

                      <div className="space-y-4">
                        {groupData.events && groupData.events.length > 0 ? (
                          groupData.events.map((event) => (
                            <Card key={event.id} className="overflow-hidden">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle>{event.title}</CardTitle>
                                    <CardDescription>
                                      {formatEventDate(event.event_time, '')}
                                    </CardDescription>
                                  </div>
                                  <Button
                                    onClick={() => handleRSVP(event.id)}
                                    className={rsvpStatus[event.id] ? "bg-green-600 hover:bg-green-700" : "bg-social hover:bg-social-dark"}
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
                                    {event.attendees ? event.attendees.length : 0 + (rsvpStatus[event.id] ? 1 : 0)}
                                    {(event.attendees ? event.attendees.length : 0 + (rsvpStatus[event.id] ? 1 : 0)) === 1 ? ' person' : ' people'} going
                                  </Badge>

                                  {rsvpStatus[event.id] && (
                                    <Badge variant="outline" className="bg-green-50">
                                      You're going
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Card className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                            <p className="text-gray-500">
                              There are no scheduled events for this group yet
                            </p>
                          </Card>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="about" className="mt-6">
                      {/* About content - keep existing code */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Info className="h-5 w-5 mr-2" />
                            About this group
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">
                            {groupData.about}
                          </p>
                          <div>
                            <h4 className="font-medium mb-2">Created on</h4>
                            <p className="text-gray-600 mb-4">
                              {new Date(groupData.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
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

                {/* Sidebar */}
                <div>
                  {/* Members - keep existing code */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {groupData.members && groupData.members.length > 0 ? (
                          groupData.members.map((member) => (
                            <div key={member.id} className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>
                                  {member.first_name[0]}{member.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium">
                                {member.first_name} {member.last_name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No members yet.</p>
                        )}
                      </div>
                      <Button variant="ghost" className="w-full mt-4 text-sm">
                        See all members
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Upcoming Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Upcoming Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {groupData.events && groupData.events.length > 0 ? (
                        <div className="space-y-4">
                          {groupData.events.slice(0, 2).map((event) => (
                            <div key={event.id} className="border-b pb-3 last:border-0">
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-gray-500 mb-1">
                                {formatEventDate(event.event_time, '')}
                              </p>
                              <div className="flex items-center">
                                <p className="text-xs text-gray-500 mr-2">
                                  {event.attendees ? event.attendees.length : 0 + (rsvpStatus[event.id] ? 1 : 0)} going
                                </p>
                                {rsvpStatus[event.id] && (
                                  <Badge variant="outline" className="text-xs bg-green-50">
                                    You're going
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          <Button variant="ghost" className="w-full text-sm">
                            See all events
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No upcoming events scheduled
                        </p>
                      )}
                    </CardContent>
                  </Card>
        </div>
      </div>

      {/* Event Creation Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create an Event</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new event for this group
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onClose={() => setIsCreateEventOpen(false)}
            onEventCreated={handleEventCreated}
            groupTitle={groupData.title}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-semibold text-social"> {groupData.title} </span>
              group and remove all its associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetail;
