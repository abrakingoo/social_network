// Optimized GroupDetail component - sidebar moved to global RightSidebar
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/context/GroupContext';
import { groupService } from '@/services/groupService';
import { findGroupBySlug } from '@/lib/slugUtils';
import PostForm from '@/components/post/PostForm';
import PostCard from '@/components/post/PostCard';
import EventForm from '@/components/group/EventForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import GroupManagementDialog from '@/components/group/GroupManagementDialog';
import { Users, Calendar, Settings, Info, UserPlus, Trash2, Loader2 } from 'lucide-react';
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
  const groupSlug = params.slug;
  const { currentUser, loading: authLoading } = useAuth();
  const { setGroupData } = useGroup();
  const { toast } = useToast();
  const [groupData, setLocalGroupData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState({});
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);


  // Update both local state and global context
  const updateGroupData = (data) => {
    setLocalGroupData(data);
    setGroupData(data);
  };

  // Full fetch for initial load
  const fetchGroupDetails = async () => {
    if (!currentUser || authLoading) {
      return;
    }

    setIsLoadingDetails(true);
    try {
      const allGroupsResult = await groupService.getAllGroups();
      const allGroups = allGroupsResult.groups || [];
      const currentGroup = findGroupBySlug(groupSlug, allGroups);

      if (currentGroup) {
        const details = await groupService.getGroupDetails(currentGroup.title);
        const userRole = currentGroup.user_role || '';
        const isJoined = currentGroup.is_joined || false;

        const initialRsvpStatus = {};
        const eventsWithRsvpStatus = (details.Events || []).map(event => {
          const isRsvpdByUser = event.user_rsvp_status === 'going';
          initialRsvpStatus[event.id] = isRsvpdByUser;
          return { ...event, is_rsvpd: isRsvpdByUser };
        });
        setRsvpStatus(initialRsvpStatus);

        const groupDataWithUser = {
          ...details,
          is_joined: isJoined,
          user_role: userRole,
          events: eventsWithRsvpStatus,
          Events: eventsWithRsvpStatus,
          group_id: currentGroup.id
        };

        updateGroupData(groupDataWithUser);
      } else {
        console.error('[GroupDetail] Group not found for slug:', groupSlug);
        toast({
          title: "Error",
          description: "Group not found.",
          variant: "destructive"
        });
        router.push('/groups');
      }
    } catch (error) {
      console.error('[GroupDetail] Error in fetchGroupDetails:', error);
      toast({
        title: "Error",
        description: "Failed to load group details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Lightweight events-only refresh function
  const refreshEventsOnly = async () => {
    if (!groupData || !groupData.title) {
      return;
    }

    setIsRefreshingEvents(true);
    try {
      const details = await groupService.getGroupDetails(groupData.title);
      const updatedRsvpStatus = {};
      const eventsWithRsvpStatus = (details.Events || []).map(event => {
        const isRsvpdByUser = event.user_rsvp_status === 'going';
        updatedRsvpStatus[event.id] = isRsvpdByUser;
        return { ...event, is_rsvpd: isRsvpdByUser };
      });

      setRsvpStatus(updatedRsvpStatus);

      const updatedGroupData = {
        ...groupData,
        Events: eventsWithRsvpStatus,
        events: eventsWithRsvpStatus,
        group_post: Array.isArray(details.group_post) ? details.group_post : [],
        members: Array.isArray(details.members) ? details.members : [],
        members_count: Array.isArray(details.members) ? details.members.length : 0
      };

      updateGroupData(updatedGroupData);
    } catch (error) {
      console.error('[GroupDetail] Error refreshing events:', error);
      throw error;
    } finally {
      setIsRefreshingEvents(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      await fetchGroupDetails();
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [groupSlug, currentUser, authLoading]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Clear group data when component unmounts
  useEffect(() => {
    return () => {
      setGroupData(null);
    };
  }, []);

  const handleEventCreated = async () => {
    setIsCreateEventOpen(false);
    toast({
      title: "Event Created",
      description: "Updating events list...",
    });

    try {
      await refreshEventsOnly();
      toast({
        title: "Success",
        description: "Your event has been created and added to the list.",
      });
    } catch (error) {
      console.error('[GroupDetail] Error refreshing events after creation:', error);
      toast({
        title: "Event Created",
        description: "Event was created successfully. Please refresh the page to see it.",
        variant: "destructive"
      });
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  if (isLoadingDetails || !groupData || !groupData.title) {
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

  const handleJoinLeaveGroup = async (isCurrentlyJoined) => {
    if (!groupData.group_id) {
      toast({
        title: "Error",
        description: "Unable to find group information.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isCurrentlyJoined) {
        const result = await groupService.leaveGroup(groupData.group_id);
        if (result.success) {
          const updatedData = { ...groupData, is_joined: false };
          updateGroupData(updatedData);
          toast({
            title: "Success",
            description: "You have left the group successfully.",
          });
        }
      } else {
        const result = await groupService.joinGroup(groupData.group_id);
        if (result.success) {
          const updatedData = { ...groupData, is_joined: true };
          updateGroupData(updatedData);
          toast({
            title: "Success",
            description: "You have joined the group successfully!",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isCurrentlyJoined ? 'leave' : 'join'} group. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleRSVP = async (eventId) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to RSVP to events.",
        variant: "destructive"
      });
      return;
    }

    const currentStatus = rsvpStatus[eventId] ? "going" : "not_going";
    const newStatus = currentStatus === "going" ? "not going" : "going";

    setRsvpStatus(prev => ({ ...prev, [eventId]: newStatus === "going" }));

    const updatedEvents = groupData.events.map(event => {
      if (event.id === eventId) {
        const updatedAttendees = newStatus === "going"
          ? [...(event.attendees || []), currentUser]
          : (event.attendees || []).filter(attendee => attendee.id !== currentUser.id);
        return {
          ...event,
          attendees: updatedAttendees,
          is_rsvpd: newStatus === "going",
        };
      }
      return event;
    });

    const updatedGroupData = {
      ...groupData,
      events: updatedEvents,
      Events: updatedEvents,
    };
    updateGroupData(updatedGroupData);

    try {
      await groupService.rsvpEvent(eventId, newStatus);
      toast({
        title: newStatus === "going" ? "RSVP Confirmed" : "RSVP Cancelled",
        description: newStatus === "going" ? "You have successfully RSVP'd for this event!" : "You have un-RSVP'd for this event.",
      });
    } catch (error) {
      setRsvpStatus(prev => ({ ...prev, [eventId]: currentStatus === "going" }));
      const revertedEvents = groupData.events.map(event => {
        if (event.id === eventId) {
          const revertedAttendees = currentStatus === "going"
            ? [...(event.attendees || []), currentUser]
            : (event.attendees || []).filter(attendee => attendee.id !== currentUser.id);
          return {
            ...event,
            attendees: revertedAttendees,
            is_rsvpd: currentStatus === "going",
          };
        }
        return event;
      });
      updateGroupData({ ...groupData, events: revertedEvents, Events: revertedEvents });
      toast({
        title: "RSVP Failed",
        description: error.message || "Failed to update RSVP status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await groupService.deleteGroup(groupData.title);
      toast({
        title: "Group Deleted",
        description: `${groupData.title} has been successfully deleted.`,
      });
      router.push('/groups');
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

  return (
    <div className="max-w-full mx-auto">
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
                {groupData.title ? groupData.title.slice(0, 2).toUpperCase() : 'GR'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-28 flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{groupData.title || 'Loading...'}</CardTitle>
              <CardDescription>
                {groupData.members_count || groupData.members?.length || 0} members ·
                Created {groupData.created_at ? new Date(groupData.created_at).toLocaleDateString() : 'Unknown'}
                {groupData.Creator && groupData.Creator.firstname && (
                  <span> · by {groupData.Creator.firstname} {groupData.Creator.lastname}</span>
                )}
              </CardDescription>
            </div>

            {groupData.user_role === 'admin' ? (
              <div className="flex space-x-2">
                <Button
                  className="bg-social hover:bg-social-dark"
                  onClick={() => setIsManageDialogOpen(true)}
                >
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
          <p className="text-gray-600">{groupData.about || 'No description available.'}</p>
        </CardContent>
      </Card>

      {/* Group Content - Full Width */}
      <div className="w-full">
        <Tabs defaultValue="posts" className="w-full mb-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="posts">Posts</TabsTrigger>
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
                  <span className="text-sm text-gray-600">Updating events...</span>
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
                            {formatEventDate(event.event_time, '')}
                            {event.location && ` · ${event.location}`}
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
                          {event.attendees ? event.attendees.length : 0}
                          {(event.attendees ? event.attendees.length : 0) === 1 ? ' person' : ' people'} going
                        </Badge>

                        {rsvpStatus[event.id] && (
                          <Badge variant="outline" className="bg-green-50">
                            You're going
                          </Badge>
                        )}
                      </div>
                      {event.creator && event.creator.firstname && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span>Created by {event.creator.firstname} {event.creator.lastname}</span>
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
                    {groupData.user_role === 'admin' ? 'Create the first event for this group!' : 'There are no scheduled events for this group yet'}
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
                  {groupData.about || 'No description available.'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-gray-600">{groupData.created_at ? new Date(groupData.created_at).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Members:</span>
                    <p className="text-gray-600">{groupData.members_count || groupData.members?.length || 0}</p>
                  </div>
                  {groupData.Creator && groupData.Creator.firstname && (
                    <div>
                      <span className="font-medium">Creator:</span>
                      <p className="text-gray-600">
                        {groupData.Creator.firstname} {groupData.Creator.lastname}
                        {groupData.Creator.nickname && ` (${groupData.Creator.nickname})`}
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
            groupTitle={groupData.title || ''}
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
              <span className="font-semibold text-social"> {groupData.title || 'this group'} </span>
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
            {/* Group Management Dialog */}
            <GroupManagementDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        groupData={groupData}
        onGroupUpdated={updateGroupData}
      />

    </div>
  );
};

export default GroupDetail;