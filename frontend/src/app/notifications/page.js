'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, UserPlus, MessageSquare, Heart, Users, Check, X, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refreshNotifications,
    respondToGroupInvitation
  } = useNotifications();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to login if not authenticated, but only after loading is false
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
      toast({
        title: 'Notifications refreshed',
        description: 'Successfully loaded latest notifications',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh notifications',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

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
      case 'follow_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'group_invitation':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'join_response':
        return <Users className="h-5 w-5 text-social" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-social" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle group invitation response
  const handleGroupInvitationResponse = async (notification, status) => {
    const success = await respondToGroupInvitation(
      notification.id,
      notification.groupId,
      status
    );

    if (success) {
      toast({
        title: status === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined',
        description: status === 'accepted'
          ? 'You have joined the group successfully!'
          : 'Group invitation declined',
      });

      // Navigate to group if accepted
      if (status === 'accepted' && notification.groupId) {
        setTimeout(() => {
          router.push(`/groups/${notification.groupId}`);
        }, 1000);
      }
    }
  };

  // Handle notification click (mark as read)
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;

    const typeMap = {
      'follow': ['follow_request'],
      'like': ['like'],
      'comment': ['comment'],
      'group': ['group_invitation', 'join_response'],
      'message': ['message']
    };

    return notifications.filter(n => typeMap[activeTab]?.includes(n.type));
  };

  const filteredNotifications = getFilteredNotifications();

  // Render notification content
  const renderNotificationContent = (notification) => {
    const actorName = notification.actor && (notification.actor.firstName || notification.actor.lastName)
      ? `${notification.actor.firstName || ''} ${notification.actor.lastName || ''}`.trim()
      : 'System';

    return (
      <div
        key={notification.id}
        className={`p-4 flex items-start cursor-pointer hover:bg-gray-50 transition-colors ${
          notification.read ? '' : 'bg-blue-50 border-l-4 border-l-blue-500'
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="mr-3 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        <Avatar className="h-10 w-10 mr-3">
          {notification.actor && notification.actor.avatar ? (
            <AvatarImage src={notification.actor.avatar} />
          ) : null}
          <AvatarFallback>
            {notification.actor && (notification.actor.firstName || notification.actor.lastName)
              ? `${notification.actor.firstName?.[0] || ''}${notification.actor.lastName?.[0] || ''}`.toUpperCase() || '?'
              : 'S'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className="text-sm">
              <span className="font-medium">{actorName}</span>
              {' '}
              {notification.content}
              {notification.groupName && (
                <span className="font-medium"> {notification.groupName}</span>
              )}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>

          {/* Action buttons for actionable notifications */}
          {notification.actionable && !notification.read && (
            <div className="mt-2 flex space-x-2">
              {notification.type === 'group_invitation' && (
                <>
                  <Button
                    size="sm"
                    className="bg-social hover:bg-social-dark"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupInvitationResponse(notification, 'accepted');
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupInvitationResponse(notification, 'declined');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}

              {notification.type === 'follow_request' && (
                <>
                  <Button size="sm" className="bg-social hover:bg-social-dark">
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}

              {notification.type === 'join_response' && notification.data?.status === 'accepted' && (
                <Button
                  size="sm"
                  className="bg-social hover:bg-social-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/groups/${notification.groupId}`);
                  }}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Visit Group
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              Notifications
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>
            )}
            {error && (
              <p className="text-sm text-red-500 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="p-4 border-b">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">
                All {notifications.length > 0 && `(${notifications.length})`}
              </TabsTrigger>
              <TabsTrigger value="follow">Follows</TabsTrigger>
              <TabsTrigger value="like">Likes</TabsTrigger>
              <TabsTrigger value="comment">Comments</TabsTrigger>
              <TabsTrigger value="group">Groups</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-10 w-10 text-gray-400 mx-auto mb-2 animate-spin" />
                  <h3 className="font-medium text-lg mb-1">Loading notifications...</h3>
                  <p className="text-gray-500">Fetching your latest notifications from the database</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map(renderNotificationContent)
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-medium text-lg mb-1">No notifications</h3>
                  <p className="text-gray-500">You don't have any notifications yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Other tabs use the same filtered content */}
          {['follow', 'like', 'comment', 'group', 'message'].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue} className="mt-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(renderNotificationContent)
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-lg mb-1">No {tabValue} notifications</h3>
                    <p className="text-gray-500">You don't have any {tabValue} notifications yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default Notifications;