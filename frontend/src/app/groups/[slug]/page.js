'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/context/GroupContext';
import { webSocketOperations, wsManager, useWebSocketNotifications } from '@/utils/websocket';
import groupService from '@/services/groupService';
import { findGroupBySlug } from '@/lib/slugUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import EventForm from '@/components/group/EventForm';
import GroupManagementDialog from '@/components/group/GroupManagementDialog';
import MemberInviteDialog from '@/components/group/MemberInviteDialog';
// Import our existing components
import GroupHeader from '@/components/group/GroupHeader';
import GroupContent from '@/components/group/GroupContent';
import NonMemberView from '@/components/group/NonMemberView';

// Request states based on backend data
const REQUEST_STATES = {
  NOT_REQUESTED: 'not_requested',
  PENDING: 'pending',
  JOINED: 'joined'
};

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
  const [isMemberInviteOpen, setIsMemberInviteOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestState, setRequestState] = useState(REQUEST_STATES.NOT_REQUESTED);

  // Enable WebSocket notifications for this component
  useWebSocketNotifications();

  // Update both local state and global context
  const updateGroupData = (data) => {
    setLocalGroupData(data);
    setGroupData(data);
  };

  // Use backend's exact field name 'JoinRequest' and user_join_request
  const determineRequestState = (groupData, currentUser) => {
    if (groupData.is_joined) {
      return REQUEST_STATES.JOINED;
    }

    // Prefer user_join_request if present
    if (groupData.user_join_request) {
      if (groupData.user_join_request.status === 'pending') {
        return REQUEST_STATES.PENDING;
      } else if (groupData.user_join_request.status === 'accepted') {
        return REQUEST_STATES.JOINED;
      } else if (groupData.user_join_request.status === 'declined') {
        return REQUEST_STATES.NOT_REQUESTED;
      }
    }

    // Fallback: Check JoinRequest array for pending request
    if (groupData.JoinRequest && currentUser) {
      const userRequest = groupData.JoinRequest.find(
        request => request.user_id === currentUser.id && request.status === 'pending'
      );
      if (userRequest) {
        return REQUEST_STATES.PENDING;
      }
    }

    return REQUEST_STATES.NOT_REQUESTED;
  };

  // Listen for real-time group updates
  useEffect(() => {
    if (!groupData?.id) return;

    const handleGroupNotificationUpdate = (event) => {
      const { groupId, notification } = event.detail;

      if (groupId === groupData.id && notification.type === 'membership_changed') {
        const { status } = notification.data;

        if (status === 'accepted') {
          setRequestState(REQUEST_STATES.JOINED);
          const updatedData = { ...groupData, is_joined: true };
          updateGroupData(updatedData);
        } else if (status === 'declined') {
          setRequestState(REQUEST_STATES.NOT_REQUESTED);
          const updatedData = { ...groupData, is_joined: false };
          updateGroupData(updatedData);
        }
      }
      // Handle real-time leave group
      if (groupId === groupData.id && notification.type === 'group_left') {
        if (notification.data.user_id === currentUser.id) {
          setRequestState(REQUEST_STATES.NOT_REQUESTED);
          const updatedData = { ...groupData, is_joined: false };
          updateGroupData(updatedData);
        }
      }
    };

    window.addEventListener('groupNotificationUpdate', handleGroupNotificationUpdate);

    return () => {
      window.removeEventListener('groupNotificationUpdate', handleGroupNotificationUpdate);
    };
  }, [groupData?.id, currentUser?.id]);

  // Listen for group management dialog open events
  useEffect(() => {
    const handleOpenGroupManagement = (event) => {
      const { groupId } = event.detail;
      if (groupId === groupData?.id && groupData?.user_role === 'admin') {
        setIsManageDialogOpen(true);
      }
    };

    window.addEventListener('openGroupManagement', handleOpenGroupManagement);

    return () => {
      window.removeEventListener('openGroupManagement', handleOpenGroupManagement);
    };
  }, [groupData?.id, groupData?.user_role]);

  // Handler functions for member invite dialog
  const handleOpenMemberInvite = () => {
    setIsMemberInviteOpen(true);
  };

  const handleCloseMemberInvite = () => {
    setIsMemberInviteOpen(false);
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

        // Use backend data to determine request state
        const newRequestState = determineRequestState(groupDataWithUser, currentUser);
        setRequestState(newRequestState);

      } else {
        toast({
          title: "Error",
          description: "Group not found.",
          variant: "destructive"
        });
        router.push('/groups');
      }
    } catch (error) {
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
        members_count: Array.isArray(details.members) ? details.members.length : 0,
        JoinRequest: details.JoinRequest || [] // CORRECTED: Use correct field name
      };

      updateGroupData(updatedGroupData);

      // Update request state based on new data
      const newRequestState = determineRequestState(updatedGroupData, currentUser);
      setRequestState(newRequestState);

    } catch (error) {
      throw error;
    } finally {
      setIsRefreshingEvents(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchGroupDetails();
    };
    fetchData();
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

  // Event handlers
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
      toast({
        title: "Event Created",
        description: "Event was created successfully. Please refresh the page to see it.",
        variant: "destructive"
      });
    }
  };

  // Use corrected WebSocket operations with proper error handling
  const handleJoinLeaveGroup = async (isCurrentlyJoined) => {
    if (!groupData.group_id) {
      toast({
        title: "Error",
        description: "Unable to find group information.",
        variant: "destructive"
      });
      return;
    }

    setIsRequesting(true);

    try {
      if (isCurrentlyJoined) {
        // Optimistic update for better UX
        setRequestState(REQUEST_STATES.NOT_REQUESTED);
        const updatedData = { ...groupData, is_joined: false };
        updateGroupData(updatedData);
        // Leave group using corrected WebSocket operation
        const result = await webSocketOperations.leaveGroup(groupData.group_id);
        if (result.success) {
          toast({
            title: "Success",
            description: "You have left the group successfully.",
          });
        }
      } else {
        // Optimistic update for better UX
        setRequestState(REQUEST_STATES.PENDING);
        // Do NOT set is_joined: true here!
        // Only update is_joined when backend confirms acceptance

        // Join group using corrected WebSocket operation
        const result = await webSocketOperations.joinGroup(groupData.group_id);
        if (result.success) {
          toast({
            title: "Request Sent",
            description: "Your request to join has been sent to the group admin for approval!",
          });
        }
      }
    } catch (error) {
      const actionText = isCurrentlyJoined ? 'leave' : 'request to join';

      // Revert optimistic update on error
      if (isCurrentlyJoined) {
        setRequestState(REQUEST_STATES.JOINED);
        const updatedData = { ...groupData, is_joined: true };
        updateGroupData(updatedData);
      } else {
        // Only revert to NOT_REQUESTED or PENDING, never set is_joined: true
        const currentState = determineRequestState(groupData, currentUser);
        setRequestState(currentState);
        const updatedData = { ...groupData, is_joined: false };
        updateGroupData(updatedData);
      }

      // Use the exact error message from the corrected WebSocket operations
      toast({
        title: "Error",
        description: error.message || `Failed to ${actionText} group. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsRequesting(false);
    }
  };

  //  handleRSVP function in group detail page
  const handleRSVP = async (eventId) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to RSVP to events.",
        variant: "destructive"
      });
      return;
    }

    // : Consistent status format throughout
    const currentStatus = rsvpStatus[eventId] ? "going" : "not_going";
    const newStatus = currentStatus === "going" ? "not_going" : "going";

    // Optimistic UI update
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

      const result = await groupService.rsvpEvent(eventId, newStatus);

      toast({
        title: newStatus === "going" ? "RSVP Confirmed" : "RSVP Cancelled",
        description: newStatus === "going"
          ? "You have successfully RSVP'd for this event!"
          : "You have un-RSVP'd for this event.",
      });
    } catch (error) {
      // Revert optimistic update on error
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

      const revertedGroupData = {
        ...groupData,
        events: revertedEvents,
        Events: revertedEvents,
      };
      updateGroupData(revertedGroupData);

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

  // Loading states
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

  return (
    <div className="max-w-full mx-auto">
      {/* Group Header - Visible to all users */}
      <GroupHeader
        groupData={groupData}
        requestState={requestState}
        isRequesting={isRequesting}
        onJoinLeave={handleJoinLeaveGroup}
        onOpenManagement={() => setIsManageDialogOpen(true)}
        onOpenMemberInvite={handleOpenMemberInvite}
        onDeleteGroup={() => setIsDeleteDialogOpen(true)}
      />

      {/* Group Content - Conditional based on membership */}
      {groupData.is_joined ? (
        <GroupContent
          groupData={groupData}
          rsvpStatus={rsvpStatus}
          isRefreshingEvents={isRefreshingEvents}
          onCreateEvent={() => setIsCreateEventOpen(true)}
          onRSVP={handleRSVP}
        />
      ) : (
        <NonMemberView
          groupData={groupData}
          requestState={requestState}
        />
      )}

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

      {/* Group Management Dialog (for admins) */}
      <GroupManagementDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        groupData={groupData}
        onGroupUpdated={updateGroupData}
      />

      {/* Member Invite Dialog (for regular members) */}
      <MemberInviteDialog
        isOpen={isMemberInviteOpen}
        onClose={handleCloseMemberInvite}
        groupData={groupData}
      />
    </div>
  );
};

export default GroupDetail;