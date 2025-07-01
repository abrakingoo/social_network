'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import notificationService from '@/services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend provides empty string ID ('') for authenticated users
  const isUserAuthenticated = useCallback(() => {
    const authenticated = currentUser && (
      currentUser.first_name ||
      currentUser.last_name ||
      currentUser.email ||
      currentUser.id !== undefined  // Accept empty string as valid ID
    );
    return authenticated;
  }, [currentUser]);

  // Generate storage key for current user (use email as fallback since ID might be empty)
  const getStorageKey = useCallback(() => {
    if (!currentUser) return null;

    // Use email as primary identifier since backend provides empty string ID
    const identifier = currentUser.email || currentUser.id || 'anonymous';
    const key = `notifications_cache_${identifier}`;
    return key;
  }, [currentUser]);

  // Cache notifications in localStorage
  const cacheNotifications = useCallback((notifs) => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(notifs));
    } catch (error) {
      // Silent fail for caching
    }
  }, [getStorageKey]);

  // Load cached notifications
  const loadCachedNotifications = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      return [];
    }

    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsedNotifications = JSON.parse(cached);
        const result = parsedNotifications.map(notif => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        return result;
      }
    } catch (error) {
      // Silent fail for cache loading
    }
    return [];
  }, [getStorageKey]);

  // Fetch notifications from database - works with empty string user ID
  const fetchNotificationsFromDB = useCallback(async () => {
    // Use proper authentication check instead of just checking ID
    if (!isUserAuthenticated()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dbNotifications = await notificationService.fetchNotifications();

      // Sort by timestamp (newest first)
      const sortedNotifications = dbNotifications.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      setNotifications(sortedNotifications);

      // Calculate unread count
      const unread = sortedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);

      // Cache for performance
      cacheNotifications(sortedNotifications);

    } catch (error) {
      setError(error.message);

      // Fallback to cached data
      const cachedNotifications = loadCachedNotifications();
      if (cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
        const unread = cachedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, isUserAuthenticated, cacheNotifications, loadCachedNotifications]);

  // Add new notification (from WebSocket)
  const addNotification = useCallback((notification) => {
    // For actionable group notifications, require a backend-provided ID
    if (notification.type === 'group_invitation' && notification.data && notification.data.id) {
      const newNotification = {
        id: notification.data.id, // Use backend ID
        timestamp: notification.data.created_at ? new Date(notification.data.created_at) : new Date(),
        read: false,
        ...notification
      };
      setNotifications(prev => {
        // Prevent duplicates by ID
        if (prev.some(n => n.id === newNotification.id)) return prev;
        const updated = [newNotification, ...prev];
        const trimmed = updated.slice(0, 100);
        cacheNotifications(trimmed);
        return trimmed;
      });
      setUnreadCount(prev => prev + 1);
      return newNotification;
    }

    // For other notifications, fallback to previous logic
    const newNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: notification.timestamp || new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      const trimmed = updated.slice(0, 100);
      cacheNotifications(trimmed);
      return trimmed;
    });
    setUnreadCount(prev => prev + 1);
    return newNotification;
  }, [cacheNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Optimistically update UI
      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        cacheNotifications(updated);
        return updated;
      });

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Send to backend via WebSocket
      await notificationService.markAsRead(notificationId);

    } catch (error) {
      // Silent fail for mark as read
    }
  }, [cacheNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);

    // Optimistically update UI
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      cacheNotifications(updated);
      return updated;
    });
    setUnreadCount(0);

    // Send each to backend
    try {
      await Promise.all(
        unreadNotifications.map(notif => notificationService.markAsRead(notif.id))
      );
    } catch (error) {
      // Silent fail for mark all as read
    }
  }, [notifications, cacheNotifications]);

  // Remove notification
  const removeNotification = useCallback(async (notificationId) => {
    const success = await notificationService.deleteNotification(notificationId);
    if (!success) {
      return;
    }
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const updated = prev.filter(n => n.id !== notificationId);
      cacheNotifications(updated);

      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }

      return updated;
    });
  }, [cacheNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [getStorageKey]);

  // Refresh notifications from database
  const refreshNotifications = useCallback(() => {
    fetchNotificationsFromDB();
  }, [fetchNotificationsFromDB]);

  // Load notifications when user authentication changes
  useEffect(() => {
    if (isUserAuthenticated()) {
      fetchNotificationsFromDB();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [currentUser, isUserAuthenticated, fetchNotificationsFromDB]);

  // WebSocket notification handlers
  const handleGroupInvitation = useCallback((data) => {
    console.log('Received group invitation:', data);
    if (data) {
      const inviter = data.actor;
      const inviterName = inviter?.nickname || inviter?.first_name || inviter?.first_name || inviter?.email || 'Someone';
      addNotification({
        type: 'group_invitation',
        title: 'Group Invitation',
        content: `${inviterName} invited you to join a group`,
        actor: inviter || null,
        groupId: data.group_id,
        groupName: data.group_name || 'a group',
        actionable: true,
        data: data
      });
    }
  }, [addNotification]);

  // Handle group view invitation notifications
  const handleGroupViewInvitation = useCallback((data) => {
    const { group_title, actor_id } = data;

    addNotification({
      type: 'group_view_invitation',
      title: 'Group Suggestion',
      content: `Someone suggested you check out "${group_title}"`,
      actor: {
        firstName: 'Someone', // Will be populated by backend if needed
        lastName: '',
        avatar: null
      },
      groupId: data.group_id,
      actionable: true,
      data: data
    });
  }, [addNotification]);

  const handleFollowRequest = useCallback((data) => {
    type: 'follow_request',
    addNotification({
      title: 'Follow Request',
      content: 'wants to follow you',
      actor: data.actor || null,
      actionable: true,
      data: data
    });
  }, [addNotification]);

  const handleJoinResponse = useCallback((data) => {
    const isAccepted = data.status === 'accepted';
    addNotification({
      type: 'join_response',
      title: isAccepted ? 'Request Accepted!' : 'Request Declined',
      content: isAccepted
        ? 'Your request to join the group was accepted'
        : 'Your request to join the group was declined',
      actor: null,
      groupId: data.group_id,
      actionable: isAccepted,
      data: data
    });
  }, [addNotification]);

  const handleGeneralNotification = useCallback((type, data) => {
    const notificationMap = {
      'like': { title: 'New Like', content: 'liked your post', icon: 'heart' },
      'comment': { title: 'New Comment', content: 'commented on your post', icon: 'message' },
      'mention': { title: 'You were mentioned', content: 'mentioned you in a post', icon: 'at' }
    };

    const config = notificationMap[type] || { title: 'Notification', content: 'sent you a notification' };

    addNotification({
      type: type,
      title: config.title,
      content: config.content,
      actor: data.actor || { firstName: 'Someone', lastName: '', avatar: null },
      postId: data.post_id,
      actionable: false,
      data: data
    });
  }, [addNotification]);

  // Handle group event notifications
  const handleGroupEventNotification = useCallback((data) => {
    addNotification({
      type: 'group_event',
      title: 'New Event Created',
      content: `Event "${data.title}" has been created`,
      actionable: false,
      data: data
    });
  }, [addNotification]);

  // Listen for WebSocket notification events
  useEffect(() => {
    if (!isUserAuthenticated()) return;

    const handleWSNotification = (event) => {
      const { type, notification } = event.detail;

      switch (type) {
        case 'group_invitation':
          handleGroupInvitation(notification.data);
          break;
        case 'group_view_invitation': // NEW case
          handleGroupViewInvitation(notification.data);
          break;
        case 'group_event':
          handleGroupEventNotification(notification.data);
          break;
        case 'follow_request':
          handleFollowRequest(notification.data);
          break;
        case 'group_join_response':
          handleJoinResponse(notification.data);
          break;
        case 'group_join_request':
          // Add a notification for group join requests (for admins)
          if (notification.data && notification.data.request && notification.data.request.id) {
            const user = notification.data.request.user;
            const displayName = user?.nickname || ((user?.firstname || user?.first_name || '') + ' ' + (user?.lastname || user?.last_name || '')).trim() || 'Someone';
            addNotification({
              type: 'group_join_request',
              title: 'New Join Request',
              content: `${displayName} requested to join your group`,
              actor: user || null,
              groupId: notification.data.group_id,
              actionable: true,
              data: notification.data
            });
          }
          break;
        case 'like':
        case 'comment':
        case 'mention':
          handleGeneralNotification(type, notification.data);
          break;
        default:
          break;
      }
    };

    window.addEventListener('wsNotification', handleWSNotification);

    return () => {
      window.removeEventListener('wsNotification', handleWSNotification);
    };
  }, [
    isUserAuthenticated,
    handleGroupInvitation,
    handleGroupViewInvitation,
    handleFollowRequest,
    handleJoinResponse,
    handleGeneralNotification
  ]);

  // Helper function to respond to group invitation
  const respondToGroupInvitation = useCallback(async (notificationId, groupId, status) => {
    try {
      await notificationService.respondToGroupInvitation(groupId, status);
      await markAsRead(notificationId);

      addNotification({
        type: 'system',
        title: status === 'accepted' ? 'Group Joined!' : 'Invitation Declined',
        content: status === 'accepted'
          ? 'You have successfully joined the group'
          : 'Group invitation declined',
        actor: null,
        actionable: false
      });

      return true;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        content: 'Failed to respond to group invitation',
        actor: null,
        actionable: false
      });

      return false;
    }
  }, [markAsRead, addNotification]);

  // Compute notification counts by type
  const notificationCounts = notifications.reduce((acc, notif) => {
    if (!notif.read) {
      if (notif.type === 'message') {
        acc.message = (acc.message || 0) + 1;
      }
    }
    return acc;
  }, {});

  const value = {
    notifications,
    unreadCount,
    notificationCounts,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refreshNotifications,
    respondToGroupInvitation
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};