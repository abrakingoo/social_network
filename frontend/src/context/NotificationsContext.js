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

  // Generate storage key for current user (cache only)
  const getStorageKey = useCallback(() => {
    return currentUser?.id ? `notifications_cache_${currentUser.id}` : null;
  }, [currentUser?.id]);

  // Cache notifications in localStorage (secondary storage)
  const cacheNotifications = useCallback((notifs) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(notifs));
    } catch (error) {
      console.error('[NotificationContext] Cache failed:', error);
    }
  }, [getStorageKey]);

  // Load cached notifications (fallback while loading from DB)
  const loadCachedNotifications = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return [];

    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsedNotifications = JSON.parse(cached);
        return parsedNotifications.map(notif => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
      }
    } catch (error) {
      console.error('[NotificationContext] Cache loading failed:', error);
    }
    return [];
  }, [getStorageKey]);

  // PRIMARY: Fetch notifications from database
  const fetchNotificationsFromDB = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[NotificationContext] Fetching from database...');
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

      console.log(`[NotificationContext] Loaded ${sortedNotifications.length} notifications from DB`);

    } catch (error) {
      console.error('[NotificationContext] Database fetch failed:', error);
      setError(error.message);

      // Fallback to cached data
      const cachedNotifications = loadCachedNotifications();
      if (cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
        const unread = cachedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log('[NotificationContext] Using cached notifications as fallback');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, cacheNotifications, loadCachedNotifications]);

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
      console.log('[NotificationContext] Added persistent group_invitation notification:', newNotification);
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
    console.log('[NotificationContext] Added real-time notification:', newNotification);
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
      console.error('[NotificationContext] Mark as read failed:', error);
      // Could revert optimistic update here if needed
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

    // Send each to backend (could be optimized with bulk endpoint)
    try {
      await Promise.all(
        unreadNotifications.map(notif => notificationService.markAsRead(notif.id))
      );
    } catch (error) {
      console.error('[NotificationContext] Mark all as read failed:', error);
    }
  }, [notifications, cacheNotifications]);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const updated = prev.filter(n => n.id !== notificationId);
      cacheNotifications(updated);

      // Update unread count if removed notification was unread
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

  // Handle group invitation from WebSocket
  const handleGroupInvitation = useCallback((data) => {
    console.log('[NotificationContext] Group invitation received:', data);
    // Only add if backend-provided ID is present
    if (data && data.id) {
      addNotification({
        type: 'group_invitation',
        title: 'Group Invitation',
        content: 'invited you to join a group',
        actor: data.inviter || {
          firstName: 'Someone',
          lastName: '',
          avatar: null
        },
        groupId: data.group_id,
        groupName: data.group_name || 'a group',
        actionable: true,
        data: data
      });
    } else {
      console.warn('[NotificationContext] Skipped group_invitation without backend ID:', data);
    }
  }, [addNotification]);

  // Handle follow request from WebSocket
  const handleFollowRequest = useCallback((data) => {
    console.log('[NotificationContext] Follow request received:', data);

    addNotification({
      type: 'follow_request',
      title: 'Follow Request',
      content: 'wants to follow you',
      actor: data.requester || {
        firstName: 'Someone',
        lastName: '',
        avatar: null
      },
      actionable: true,
      data: data
    });
  }, [addNotification]);

  // Handle join request accepted/declined
  const handleJoinResponse = useCallback((data) => {
    console.log('[NotificationContext] Join response received:', data);

    const isAccepted = data.status === 'accepted';
    addNotification({
      type: 'join_response',
      title: isAccepted ? 'Request Accepted!' : 'Request Declined',
      content: isAccepted
        ? 'Your request to join the group was accepted'
        : 'Your request to join the group was declined',
      actor: null, // System notification
      groupId: data.group_id,
      actionable: isAccepted, // Only show action if accepted
      data: data
    });
  }, [addNotification]);

  // Handle general notifications (likes, comments, etc.)
  const handleGeneralNotification = useCallback((type, data) => {
    console.log(`[NotificationContext] ${type} notification received:`, data);

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

  // Listen for WebSocket notification events
  useEffect(() => {
    if (!currentUser) return;

    const handleWSNotification = (event) => {
      const { type, notification } = event.detail;
      console.log('[NotificationContext] WebSocket notification:', { type, notification });

      switch (type) {
        case 'group_invitation':
          handleGroupInvitation(notification.data);
          break;
        case 'follow_request':
          handleFollowRequest(notification.data);
          break;
        case 'group_join_response':
          handleJoinResponse(notification.data);
          break;
        case 'like':
        case 'comment':
        case 'mention':
          handleGeneralNotification(type, notification.data);
          break;
        default:
          console.log('[NotificationContext] Unknown notification type:', type);
      }
    };

    // Listen for WebSocket notifications
    window.addEventListener('wsNotification', handleWSNotification);

    return () => {
      window.removeEventListener('wsNotification', handleWSNotification);
    };
  }, [currentUser, handleGroupInvitation, handleFollowRequest, handleJoinResponse, handleGeneralNotification]);

  // PRIMARY: Load notifications from database when user logs in
  useEffect(() => {
    if (currentUser?.id) {
      console.log('[NotificationContext] User logged in, fetching notifications...');
      fetchNotificationsFromDB();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [currentUser?.id, fetchNotificationsFromDB]);

  // Helper function to respond to group invitation
  const respondToGroupInvitation = useCallback(async (notificationId, groupId, status) => {
    try {
      await notificationService.respondToGroupInvitation(groupId, status);

      // Mark notification as read
      await markAsRead(notificationId);

      // Add a success notification
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
      console.error('[NotificationContext] Group invitation response failed:', error);

      // Add error notification
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

  // Compute notification counts by type for Navbar and other consumers
  const notificationCounts = notifications.reduce((acc, notif) => {
    if (!notif.read) {
      if (notif.type === 'message') {
        acc.message = (acc.message || 0) + 1;
      }
      // Add more types as needed
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
    refreshNotifications, // New: allow manual refresh
    respondToGroupInvitation
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};