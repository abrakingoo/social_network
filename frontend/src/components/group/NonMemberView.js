
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';

const REQUEST_STATES = {
  NOT_REQUESTED: 'not_requested',
  PENDING: 'pending',
  JOINED: 'joined'
};

const NonMemberView = ({ groupData, requestState }) => {
  return (
    <div className="w-full">
      <Card className="p-8 text-center">
        <Users className="h-16 w-16 text-social mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Join {groupData.title}</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          {groupData.about || 'This group is private. Request to join to see posts and participate in discussions.'}
        </p>

        <div className="flex justify-center gap-4 text-sm text-gray-500 mb-6">
          <span>{groupData.members_count || 0} members</span>
          <span>•</span>
          <span>Created {groupData.created_at ? new Date(groupData.created_at).toLocaleDateString() : 'Unknown'}</span>
          {groupData.Creator && groupData.Creator.firstname && (
            <>
              <span>•</span>
              <span>by {groupData.Creator.firstname} {groupData.Creator.lastname}</span>
            </>
          )}
        </div>

        {requestState === REQUEST_STATES.PENDING ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Request Pending</span>
            </div>
            <p className="text-sm text-orange-600">
              Your request to join this group is awaiting approval from the group admin.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Use the "Request to Join" button in the header above to join this group.
            The group admin will review your request.
          </p>
        )}
      </Card>
    </div>
  );
};

export default NonMemberView;
