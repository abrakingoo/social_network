'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, UserPlus, MessageSquare, Heart, Users } from 'lucide-react';

const Notifications = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Mock notifications
  const mockNotifications = [
    {
      id: '1',
      type: 'follow',
      actor: { id: '101', firstName: 'John', lastName: 'Doe', avatar: null },
      content: 'started following you',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      read: false
    },
    {
      id: '2',
      type: 'like',
      actor: { id: '102', firstName: 'Jane', lastName: 'Smith', avatar: null },
      content: 'liked your post',
      postId: '201',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false
    },
    {
      id: '3',
      type: 'comment',
      actor: { id: '103', firstName: 'Mike', lastName: 'Johnson', avatar: null },
      content: 'commented on your post',
      postId: '202',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      read: true
    },
    {
      id: '4',
      type: 'group',
      actor: { id: '104', firstName: 'Sarah', lastName: 'Wilson', avatar: null },
      content: 'invited you to join the group',
      groupId: '301',
      groupName: 'Tech Enthusiasts',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      read: true
    },
    {
      id: '5',
      type: 'message',
      actor: { id: '105', firstName: 'Alex', lastName: 'Brown', avatar: null },
      content: 'sent you a message',
      chatId: '401',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false
    }
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const formatTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'group':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-social" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = activeTab === "all"
    ? mockNotifications
    : mockNotifications.filter(n => n.type === activeTab);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="p-4 border-b">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="follow">Follows</TabsTrigger>
              <TabsTrigger value="like">Likes</TabsTrigger>
              <TabsTrigger value="comment">Comments</TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="divide-y">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 flex items-start ${notification.read ? '' : 'bg-gray-50'}`}
                  >
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={notification.actor.avatar} />
                      <AvatarFallback>
                        {notification.actor.firstName[0]}{notification.actor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm">
                          <span className="font-medium">
                            {notification.actor.firstName} {notification.actor.lastName}
                          </span>
                          {' '}
                          {notification.content}
                          {notification.groupName && (
                            <span className="font-medium"> {notification.groupName}</span>
                          )}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>

                      {(notification.type === 'follow' || notification.type === 'group') && (
                        <div className="mt-2 flex space-x-2">
                          <Button size="sm" className="bg-social hover:bg-social-dark">
                            {notification.type === 'follow' ? 'Follow Back' : 'Accept'}
                          </Button>
                          <Button size="sm" variant="outline">
                            {notification.type === 'follow' ? 'Ignore' : 'Decline'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-medium text-lg mb-1">No notifications</h3>
                  <p className="text-gray-500">You don't have any notifications yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="follow" className="mt-0">
            {/* Content will be filtered based on the activeTab state */}
            {/* Same structure as "all" tab */}
          </TabsContent>

          <TabsContent value="like" className="mt-0">
            {/* Content will be filtered based on the activeTab state */}
            {/* Same structure as "all" tab */}
          </TabsContent>

          <TabsContent value="comment" className="mt-0">
            {/* Content will be filtered based on the activeTab state */}
            {/* Same structure as "all" tab */}
          </TabsContent>

          <TabsContent value="message" className="mt-0">
            {/* Content will be filtered based on the activeTab state */}
            {/* Same structure as "all" tab */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Notifications;
