
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Search, UserPlus } from 'lucide-react';
import groupService from '@/services/groupService';

const MemberInviteDialog = ({ isOpen, onClose, groupData }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // State management
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingUsers, setInvitingUsers] = useState(new Set());

  // Load available users when dialog opens
  useEffect(() => {
    if (isOpen && groupData?.id) {
      loadAvailableUsers();
    }
  }, [isOpen, groupData?.id]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use the same approach as GroupManagementDialog
      const users = await groupService.getAllUsers();

      // Handle empty users array gracefully
      if (!users || !Array.isArray(users)) {
        setAvailableUsers([]);
        return;
      }

      if (users.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Create set of existing member IDs for efficient filtering
      const memberIds = new Set(groupData?.members?.map(m => m.id) || []);

      // Filter out current user and existing members
      const filtered = users.filter(user => {
        // Check if user object is valid
        if (!user || !user.id) {
          return false;
        }

        // Exclude current user
        if (currentUser?.id && user.id === currentUser.id) {
          return false;
        }

        // Exclude existing members
        if (memberIds.has(user.id)) {
          return false;
        }

        return true;
      });

      setAvailableUsers(filtered);

      // Show a toast if no users are available to invite
      if (filtered.length === 0 && users.length > 0) {
        toast({
          title: "No Users Available",
          description: "All users are either already members or there are no users to invite at this time.",
        });
      }

    } catch (error) {
      // Better error handling without console.error
      toast({
        title: "Error",
        description: "Failed to load available users. Please try again later.",
        variant: "destructive"
      });
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle member invitation proposal
  const handleProposeInvite = async (userId) => {
    setInvitingUsers(prev => new Set([...prev, userId]));

    try {
      // Use new WebSocket operation for member proposals
      await groupService.proposeMemberInvitation(groupData.id, userId);

      // Remove user from available list
      setAvailableUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Invitation Proposed",
        description: "The user has been notified about this group and can request to join"
      });

    } catch (error) {
      // Better error handling without console.error
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation proposal",
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
      <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest Members for {groupData?.title}</DialogTitle>
          <DialogDescription>
            Propose users to join this group. They&apos;ll get a notification to view the group and can request to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users to invite..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users list */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={`${user.firstname} ${user.lastname}`} />
                      <AvatarFallback>
                        {user.firstname?.[0]}{user.lastname?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.nickname || `${user.firstname} ${user.lastname}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.firstname} {user.lastname}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleProposeInvite(user.id)}
                    disabled={invitingUsers.has(user.id)}
                    className="bg-social hover:bg-social-dark"
                  >
                    {invitingUsers.has(user.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Suggest
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "No users found" : "No users available"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "All eligible users are already members or have been invited"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberInviteDialog;
