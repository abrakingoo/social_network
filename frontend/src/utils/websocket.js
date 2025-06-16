// WebSocket utility for real-time communication in the social network
// Handles private chats, group chats, notifications (likes, comments, followings, events, etc.)

import { useEffect, useRef, useState } from 'react';

// WebSocket connection manager (singleton)
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.pendingOperations = new Map(); // For promise-based operations
    this.operationTimeout = 10000; // 10 seconds timeout for operations
  }

  // Initialize WebSocket connection
  connect(url) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.isConnecting = true;
    console.log('Attempting to connect to WebSocket:', url);
    this.ws = new WebSocket(url);
    this.reconnectAttempts++;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset on successful connection
      this.notifyListeners('connection', { status: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Handle promise-based operations first
        this.handlePromiseResponse(data);

        // Then notify regular listeners
        this.notifyListeners(data.type, data.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.isConnecting = false;
      this.notifyListeners('connection', { status: 'disconnected' });

      // Reject all pending operations
      this.rejectAllPendingOperations(new Error('WebSocket connection closed'));

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.connect(url), this.reconnectInterval);
      } else {
        console.error('Max reconnect attempts reached. Could not reconnect to WebSocket.');
      }
    };
  }

  // Handle responses for promise-based operations
  handlePromiseResponse(data) {
    // Look for pending operations that match this response
    for (const [operationId, operation] of this.pendingOperations.entries()) {
      if (this.isResponseForOperation(data, operation)) {
        clearTimeout(operation.timeoutId);

        if (data.type === 'error') {
          operation.reject(new Error(data.message || 'Operation failed'));
        } else {
          // For group operations, we expect success response or specific operation responses
          operation.resolve({
            success: true,
            message: data.message || 'Operation completed successfully',
            data: data.data || data
          });
        }

        this.pendingOperations.delete(operationId);
        break;
      }
    }
  }

  // Check if a response matches a pending operation
  isResponseForOperation(response, operation) {
    // Simple matching based on timing and operation type
    const timeDiff = Date.now() - operation.timestamp;
    const isWithinTimeframe = timeDiff < this.operationTimeout;

    // Match based on operation type and response relevance
    const operationMatches = (
      (operation.type === 'group_join_request' && (response.type === 'error' || response.type === 'success')) ||
      (operation.type === 'exit_group' && (response.type === 'error' || response.type === 'success')) ||
      (operation.type === 'group_invitation' && (response.type === 'error' || response.type === 'success'))
    );

    return isWithinTimeframe && operationMatches;
  }

  // Reject all pending operations (used when connection closes)
  rejectAllPendingOperations(error) {
    for (const [operationId, operation] of this.pendingOperations.entries()) {
      clearTimeout(operation.timeoutId);
      operation.reject(error);
    }
    this.pendingOperations.clear();
  }

  // Add event listener for specific message types
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  // Remove event listener
  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  // Notify all listeners for a specific event type
  notifyListeners(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => callback(data));
    }
  }

  // Send message through WebSocket (fire-and-forget)
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      console.log('WebSocket message sent:', message);
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  // Send message and wait for response (promise-based)
  async sendAndWait(type, data, timeout = this.operationTimeout) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const operationId = Date.now() + Math.random();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingOperations.delete(operationId);
        reject(new Error('Operation timed out'));
      }, timeout);

      // Store the operation
      this.pendingOperations.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
        type,
        data,
        timeoutId
      });

      // Send the message
      try {
        const message = JSON.stringify({ type, data });
        this.ws.send(message);
        console.log('WebSocket message sent (with response expected):', message);
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingOperations.delete(operationId);
        reject(error);
      }
    });
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// Custom hook for using WebSocket in React components
export const useWebSocket = (type, callback) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Replace with your backend WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/api/ws';
    wsManager.connect(wsUrl);

    const connectionCallback = (data) => {
      setIsConnected(data.status === 'connected');
    };

    const messageCallback = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    wsManager.addListener('connection', connectionCallback);
    if (type) {
      wsManager.addListener(type, messageCallback);
    }

    return () => {
      wsManager.removeListener('connection', connectionCallback);
      if (type) {
        wsManager.removeListener(type, messageCallback);
      }
      // Optionally disconnect on unmount if no other components are using it
      // wsManager.disconnect();
    };
  }, [type]);

  return {
    isConnected,
    send: (type, data) => wsManager.send(type, data),
    sendAndWait: (type, data, timeout) => wsManager.sendAndWait(type, data, timeout)
  };
};

// Supported event types for reference
export const EVENT_TYPES = {
  // Core messaging
  PRIVATE_MESSAGE: 'private_message',
  GROUP_MESSAGE: 'group_message',

  // Follow system
  FOLLOW_REQUEST: 'follow_request',
  RESPOND_FOLLOW_REQUEST: 'respond_follow_request',
  UNFOLLOW: 'unfollow',
  CANCEL_FOLLOW_REQUEST: 'cancel_follow_request',

  // Group system
  GROUP_JOIN_REQUEST: 'group_join_request',
  RESPOND_GROUP_JOIN_REQUEST: 'respond_group_join_request',
  EXIT_GROUP: 'exit_group',
  GROUP_INVITATION: 'group_invitation',
  RESPOND_GROUP_INVITATION: 'respond_group_invitation',
  CANCEL_GROUP_INVITATION: 'cancel_group_invitation',
  CANCEL_GROUP_JOIN_REQUEST: 'cancel_group_join_request',

  // Notifications
  NOTIFICATION_LIKE: 'like',
  NOTIFICATION_COMMENT: 'comment',
  NOTIFICATION_FOLLOW_REQUEST: 'follow_request',
  NOTIFICATION_FOLLOW_ACCEPT: 'follow_accept',
  NOTIFICATION_GROUP_INVITE: 'group_invite',
  NOTIFICATION_GROUP_JOIN_REQUEST: 'group_join_request',
  NOTIFICATION_GROUP_JOIN_ACCEPT: 'group_join_accept',
  NOTIFICATION_EVENT_CREATE: 'event_create',
  NOTIFICATION_EVENT_RESPONSE: 'event_response',
  READ_NOTIFICATION: 'read_notification',
  READ_PRIVATE_MESSAGE: 'read_private_message'
};

// Utility functions for common WebSocket operations
export const webSocketOperations = {
  // Group operations
  async joinGroup(groupId) {
    return wsManager.sendAndWait(EVENT_TYPES.GROUP_JOIN_REQUEST, { group_id: groupId });
  },

  async leaveGroup(groupId) {
    return wsManager.sendAndWait(EVENT_TYPES.EXIT_GROUP, { group_id: groupId });
  },

  async inviteToGroup(groupId, userId) {
    return wsManager.sendAndWait(EVENT_TYPES.GROUP_INVITATION, {
      group_id: groupId,
      recipient_Id: userId
    });
  },

  async respondToGroupInvitation(groupId, status) {
    return wsManager.sendAndWait(EVENT_TYPES.RESPOND_GROUP_INVITATION, {
      group_id: groupId,
      status
    });
  },

  async respondToJoinRequest(groupId, userId, status) {
    return wsManager.sendAndWait(EVENT_TYPES.RESPOND_GROUP_JOIN_REQUEST, {
      group_id: groupId,
      recipient_Id: userId,
      status
    });
  },

  // Follow operations
  async sendFollowRequest(userId) {
    return wsManager.sendAndWait(EVENT_TYPES.FOLLOW_REQUEST, { recipient_Id: userId });
  },

  async respondToFollowRequest(userId, status) {
    return wsManager.sendAndWait(EVENT_TYPES.RESPOND_FOLLOW_REQUEST, {
      recipient_Id: userId,
      status
    });
  },

  async unfollowUser(userId) {
    return wsManager.sendAndWait(EVENT_TYPES.UNFOLLOW, { recipient_Id: userId });
  },

  // Messaging (fire-and-forget)
  sendPrivateMessage(userId, message) {
    wsManager.send(EVENT_TYPES.PRIVATE_MESSAGE, { recipient_Id: userId, message });
  },

  sendGroupMessage(groupId, message) {
    wsManager.send(EVENT_TYPES.GROUP_MESSAGE, { group_id: groupId, message });
  },

  // Notifications (fire-and-forget)
  markNotificationAsRead(notificationId) {
    wsManager.send(EVENT_TYPES.READ_NOTIFICATION, { notification_id: notificationId });
  },

  markPrivateMessageAsRead(messageId) {
    wsManager.send(EVENT_TYPES.READ_PRIVATE_MESSAGE, { message_id: messageId });
  }
};

export default wsManager;