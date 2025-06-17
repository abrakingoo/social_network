// frontend/src/components/group/GroupManagementDialog.js - CORRECTED: Use backend's exact field name 'JoinRequest'
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { webSocketOperations, wsManager } from '@/utils/websocket';
import groupService from '@/services/groupService';
import { Users, UserPlus, Loader2, Check, X, Search, Bell } from 'lucide-react';
import { useGroup } from '@/context/GroupContext';

export default function GroupManagementDialog({ isOpen, onClose, groupData, onGroupUpdated }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { setGroupData } = useGroup();

  // State management
  const [activeTab, setActiveTab] = useState('members');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingUsers, setInvitingUsers] = useState(new Set());
  const [processingRequests, setProcessingRequests] = useState(new Set());

  // CORRECTED: Join requests state management using correct field name
  const [joinRequests, setJoinRequests] = useState([]);
  const [newRequestCount, setNewRequestCount] = useState(0);

  // CORRECTED: Initialize join requests from groupData.JoinRequest or groupData.join_request
  useEffect(() => {
    const requests = groupData?.JoinRequest || groupData?.join_request || [];
    setJoinRequests(requests);
      setNewRequestCount(0);
  }, [groupData?.JoinRequest, groupData?.join_request]);

  // Subscribe to real-time group notifications with exact backend format
  useEffect(() => {
    if (!isOpen || !groupData?.id) return;

    const unsubscribe = wsManager.subscribeToGroupNotifications(
      groupData.id,
      handleRealTimeNotification
    );

    return unsubscribe;
  }, [isOpen, groupData?.id]);

  // Handle real-time notifications with exact backend format
  const handleRealTimeNotification = (notification) => {
    if (notification.type === 'join_request') {
      const { group_id, request } = notification.data;

      // Only handle notifications for this specific group
      if (group_id === groupData.id) {
        // If request object is present, add it instantly to state and global group data
        if (request && request.id) {
          setJoinRequests(prev => {
            if (prev.some(r => r.id === request.id)) return prev;
            return [request, ...prev];
          });
          // Update global group data (context)
          setGroupData(prev => {
            if (!prev) return prev;
            const prevRequests = prev.JoinRequest || prev.join_request || [];
            if (prevRequests.some(r => r.id === request.id)) return prev;
            return {
              ...prev,
              JoinRequest: [request, ...prevRequests]
            };
          });
          // Also update parent if needed
          if (onGroupUpdated) {
            onGroupUpdated({
              ...groupData,
              JoinRequest: [request, ...(groupData.JoinRequest || groupData.join_request || [])]
            });
          }
        } else {
          // Fallback: Refresh group data to get the latest join requests
        refreshGroupData();
        }

        // Update new request count if not on requests tab
        if (activeTab !== 'requests') {
          setNewRequestCount(prev => prev + 1);

          // Show notification
          toast({
            title: "New Join Request",
            description: "Someone wants to join your group",
            action: (
              <Button
                size="sm"
                onClick={() => {
                  setActiveTab('requests');
                  setNewRequestCount(0);
                }}
                className="bg-social hover:bg-social-dark"
              >
                Review
              </Button>
            ),
          });
        }
      }
    }
  };

  // Reset new request count when switching to requests tab
  useEffect(() => {
    if (activeTab === 'requests') {
      setNewRequestCount(0);
    }
  }, [activeTab]);

  // CORRECTED: Refresh group data to get latest join requests (accept both field names)
  const refreshGroupData = async () => {
    if (!groupData?.title) return;

    try {
      const updatedDetails = await groupService.getGroupDetails(groupData.title);
      const requests = updatedDetails.JoinRequest || updatedDetails.join_request || [];
      setJoinRequests(requests);

      // Update parent component with fresh data
      if (onGroupUpdated) {
        onGroupUpdated({
          ...groupData,
          ...updatedDetails,
          JoinRequest: requests
        });
      }
    } catch (error) {
      console.error('Error refreshing group data:', error);
    }
  };

  // Fetch available users for invitations
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await groupService.getAllUsers();

      if (!users || !Array.isArray(users)) {
        setAvailableUsers([]);
        return;
      }

      const memberIds = new Set(groupData.members?.map(m => m.id) || []);
      const filtered = users.filter(user =>
        user.id !== currentUser.id &&
        !memberIds.has(user.id)
      );

      setAvailableUsers(filtered);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive"
      });
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load data when dialog opens (always fetch latest)
  useEffect(() => {
    if (isOpen && currentUser && groupData) {
      refreshGroupData(); // <-- Always fetch latest join requests
      fetchAvailableUsers();
    }
  }, [isOpen, currentUser, groupData]);

  // Handle join request responses using exact backend format
  const handleJoinRequestResponse = async (requestId, userId, status) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));

    // Optimistic update - remove from list immediately
    setJoinRequests(prev => prev.filter(req => req.id !== requestId));

    try {
      // Use WebSocket to respond with exact backend payload format
      await webSocketOperations.respondToJoinRequest(groupData.id, userId, status);

      // If accepted, refresh group data to show new member
      if (status === 'accepted' && onGroupUpdated) {
        setTimeout(async () => {
          try {
            const updatedDetails = await groupService.getGroupDetails(groupData.title);
            const requests = updatedDetails.JoinRequest || updatedDetails.join_request || [];
            onGroupUpdated({
              ...groupData,
              ...updatedDetails,
              members: updatedDetails.members || [],
              JoinRequest: requests
            });
          } catch (error) {
            console.error('Error refreshing group data:', error);
          }
        }, 500); // Small delay to ensure backend has processed
      }

      toast({
        title: status === 'accepted' ? "Request Accepted" : "Request Declined",
        description: status === 'accepted'
          ? "User has been added to the group"
          : "Join request has been declined"
      });

    } catch (error) {
      console.error('Error responding to join request:', error);

      // CORRECTED: Revert optimistic update on error using correct field name
      const originalRequest = (groupData.JoinRequest || groupData.join_request || []).find(req => req.id === requestId);
      if (originalRequest) {
        setJoinRequests(prev => [originalRequest, ...prev]);
      }

      // Show appropriate error message
      toast({
        title: "Error",
        description: error.message || "Failed to respond to join request",
        variant: "destructive"
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Handle user invitations using exact backend format
  const handleInviteUser = async (userId) => {
    setInvitingUsers(prev => new Set([...prev, userId]));

    try {
      await webSocketOperations.inviteToGroup(groupData.id, userId);

      // Remove user from available list
      setAvailableUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Invitation Sent",
        description: "User has been invited to join the group"
      });

    } catch (error) {
      console.error('Error inviting user:', error);

      // Show appropriate error message
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Filter users based on search
  const filteredUsers = availableUsers.filter(user =>
    (user.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Group: {groupData?.title}</DialogTitle>
          <DialogDescription>
            Manage group members, send invitations, and handle join requests
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">
              Members ({groupData?.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invite">
              Invite Users
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests ({joinRequests.length})
              {newRequestCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {newRequestCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-3">
              {groupData?.members && groupData.members.length > 0 ? (
                groupData.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.firstname?.[0] || member.first_name?.[0]}
                          {member.lastname?.[0] || member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.nickname || `${member.firstname || member.first_name} ${member.lastname || member.last_name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.role === 'admin' ? 'Administrator' : 'Member'}
                        </p>
                      </div>
                    </div>
                    {member.role === 'admin' && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No members found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users to invite..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstname?.[0] || user.first_name?.[0]}
                          {user.lastname?.[0] || user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.nickname || `${user.firstname || user.first_name} ${user.lastname || user.last_name}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInviteUser(user.id)}
                      disabled={invitingUsers.has(user.id)}
                      className="bg-social hover:bg-social-dark"
                    >
                      {invitingUsers.has(user.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No users found matching your search' : 'No users available to invite'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {joinRequests.length > 0 ? (
              <div className="space-y-3">
                {joinRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user?.avatar} />
                        <AvatarFallback>
                          {request.user?.firstname?.[0] || request.user?.first_name?.[0]}
                          {request.user?.lastname?.[0] || request.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.user?.nickname || `${request.user?.firstname || request.user?.first_name} ${request.user?.lastname || request.user?.last_name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequestResponse(request.id, request.user_id, 'accepted')}
                        disabled={processingRequests.has(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingRequests.has(request.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequestResponse(request.id, request.user_id, 'declined')}
                        disabled={processingRequests.has(request.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {processingRequests.has(request.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending join requests</h3>
                <p className="text-gray-500">
                  When users request to join this group, they'll appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}