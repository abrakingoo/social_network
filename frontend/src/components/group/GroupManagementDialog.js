'use client';


import React, { useState, useEffect } from 'react';
import { useWebSocket, EVENT_TYPES } from '@/utils/websocket';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserPlus,
  Search,
  Crown,
  UserMinus,
  Mail,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react';

const GroupManagementDialog = ({
  isOpen,
  onClose,
  groupData,
  onGroupUpdated
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { send } = useWebSocket();

  // State management
  const [activeTab, setActiveTab] = useState('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(new Set());
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  // Fetch available users (followers + following) when dialog opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchAvailableUsers();
      fetchPendingInvitations();
      fetchJoinRequests();
    }
  }, [isOpen, currentUser]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch current user's followers and following
      const response = await fetch('/api/getAllUsers', {
        credentials: 'include',
      });

      if (response.ok) {
        const users = await response.json();

        // Filter out users who are already members
        const memberIds = new Set(groupData.members?.map(m => m.id) || []);
        const filtered = users.filter(user =>
          user.id !== currentUser.id && // Not current user
          !memberIds.has(user.id) // Not already a member
        );

        setAvailableUsers(filtered);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingInvitations = async () => {
    // In a real implementation, you'd fetch this from the backend
    // For now, we'll use empty array as the backend doesn't expose this endpoint
    setPendingInvitations([]);
  };

  const fetchJoinRequests = async () => {
    // In a real implementation, you'd fetch this from the backend
    // For now, we'll use empty array as the backend doesn't expose this endpoint
    setJoinRequests([]);
  };

  const handleInviteUser = async (userId) => {
    if (!groupData?.group_id) {
      toast({
        title: "Error",
        description: "Group information not available",
        variant: "destructive"
      });
      return;
    }

    setSendingInvites(prev => new Set(prev).add(userId));

    try {
      // Use existing WebSocket invitation system
      send(EVENT_TYPES.GROUP_INVITATION, {
        group_id: groupData.group_id,
        recipient_Id: userId
      });

      // Remove user from available list
      setAvailableUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Invitation Sent",
        description: "Group invitation has been sent successfully",
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setSendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!groupData?.group_id) return;

    // This would require a new WebSocket event or API endpoint
    // For now, show a message that this feature needs to be implemented
    toast({
      title: "Feature Pending",
      description: "Member removal functionality needs to be implemented in the backend",
      variant: "default"
    });
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const nickname = (user.nickname || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || nickname.includes(query);
  });

  const isUserAdmin = groupData?.user_role === 'admin';

  if (!isUserAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Group: {groupData?.title}
          </DialogTitle>
          <DialogDescription>
            Manage group members, send invitations, and handle join requests
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">
              Members ({groupData?.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invite">
              Invite Users
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests (0)
            </TabsTrigger>
          </TabsList>

          {/* Current Members Tab */}
          <TabsContent value="members" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {groupData?.members?.map((member) => (
                  <Card key={member.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {`${member.firstname?.[0] || ''}${member.lastname?.[0] || ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.firstname} {member.lastname}
                            {member.role === 'admin' && (
                              <Crown className="inline h-4 w-4 ml-1 text-yellow-500" />
                            )}
                          </div>
                          {member.nickname && (
                            <div className="text-sm text-gray-500">@{member.nickname}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.role !== 'admin' && member.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Invite Users Tab */}
          <TabsContent value="invite" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users to invite..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <ScrollArea className="h-[350px] pr-4">
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    {searchQuery ? 'No users found matching your search' : 'No users available to invite'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                              {user.nickname && (
                                <div className="text-sm text-gray-500">@{user.nickname}</div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {user.is_public ? 'Public' : 'Private'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleInviteUser(user.id)}
                            disabled={sendingInvites.has(user.id)}
                            className="bg-social hover:bg-social-dark"
                          >
                            {sendingInvites.has(user.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Invite
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Join Requests Tab */}
          <TabsContent value="requests" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="text-center p-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending join requests</p>
                <p className="text-sm mt-1">
                  When users request to join this group, they'll appear here
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagementDialog;
