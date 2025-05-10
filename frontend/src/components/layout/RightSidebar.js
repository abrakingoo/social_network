'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const RightSidebar = () => {
  const { currentUser, getAllUsers } = useAuth();

  if (!currentUser) return null;

  // Get all users except current user
  const otherUsers = getAllUsers().filter(user => user.id !== currentUser.id);

  // Mock online users (first 3 users)
  const onlineUsers = otherUsers.slice(0, 3);

  // Mock friend suggestions (rest of the users)
  const friendSuggestions = otherUsers.slice(3, 6);

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: '1',
      title: 'Tech Conference 2023',
      date: '2023-10-15T09:00:00Z',
      attendees: 156
    },
    {
      id: '2',
      title: 'Design Workshop',
      date: '2023-10-20T14:00:00Z',
      attendees: 42
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="hidden lg:block w-64 p-2 flex-shrink-0 space-y-3">
      {/* Online Friends */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="font-medium mb-3">Online Friends</h3>
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                <span className="sr-only">Message</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                </svg>
              </Button>
            </div>
          ))}

          {onlineUsers.length === 0 && (
            <p className="text-sm text-gray-500">No friends online right now.</p>
          )}
        </div>
      </div>

      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="font-medium mb-3">People You May Know</h3>
        <div className="space-y-3">
          {friendSuggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.firstName} />
                  <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    5 mutual friends
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">Add</Button>
            </div>
          ))}

          {friendSuggestions.length === 0 && (
            <p className="text-sm text-gray-500">No suggestions available.</p>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="font-medium mb-3">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="border border-gray-100 rounded-lg p-2">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(event.date)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  {event.attendees} going
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-social">
                  Interested
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
