'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, UserPlus, Trash2, Clock, Loader2 } from 'lucide-react';

const REQUEST_STATES = {
  NOT_REQUESTED: 'not_requested',
  PENDING: 'pending',
  JOINED: 'joined'
};

const GroupHeader = ({
  groupData,
  requestState,
  isRequesting,
  onJoinLeave,
  onOpenManagement,
  onOpenMemberInvite, // NEW: Added member invite handler
  onDeleteGroup
}) => {
  // Get button props based on current state
  const getJoinButtonProps = () => {
    if (requestState === REQUEST_STATES.PENDING) {
      return {
        children: (
          <>
            <Clock className="h-4 w-4 mr-2" />
            Request Pending
          </>
        ),
        variant: "outline",
        disabled: true,
        className: "border-orange-300 text-orange-700 bg-orange-50"
      };
    }

    if (isRequesting) {
      return {
        children: (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Requesting...
          </>
        ),
        disabled: true,
        className: "bg-social hover:bg-social-dark"
      };
    }

    return {
      children: (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Request to Join
        </>
      ),
      className: "bg-social hover:bg-social-dark"
    };
  };

  return (
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

          {/* Smart action button based on user state */}
          {groupData.user_role === 'admin' ? (
            <div className="flex space-x-2">
              <Button
                className="bg-social hover:bg-social-dark"
                onClick={onOpenManagement}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Group
              </Button>
              <Button variant="destructive" onClick={onDeleteGroup}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          ) : groupData.is_joined ? (
            <div className="flex space-x-2">
              {/* NEW: Invite Members button for regular members */}
              <Button
                variant="outline"
                onClick={onOpenMemberInvite}
                className="border-social text-social hover:bg-social hover:text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button variant="outline" onClick={() => onJoinLeave(true)}>
                Leave Group
              </Button>
            </div>
          ) : (
            <Button
              {...getJoinButtonProps()}
              onClick={() => onJoinLeave(false)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{groupData.about || 'No description available.'}</p>
      </CardContent>
    </Card>
  );
};

export default GroupHeader;
