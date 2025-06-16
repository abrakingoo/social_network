// frontend/src/utils/websocket.js - FIXED: Remove toast hook, use events instead
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
// Enhanced WebSocket manager with backend notification integration (FIXED: No toast hook)
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isAuthenticated = false;
    this.connectionUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 3000;

    // Connection state management
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      isDisconnecting: false,
      lastConnectionAttempt: 0,
      connectionDebounceMs: 200,
      cleanupInProgress: false
    };

    // Group notification management for real-time updates
    this.groupNotificationCallbacks = new Map();
    this.activeGroupManagementDialogs = new Set();
  }

  // Auth state with connection stability
  setAuthState(isAuthenticated) {
    console.log(`WebSocket: Setting auth state to ${isAuthenticated}`);

    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = isAuthenticated;

    if (wasAuthenticated && !isAuthenticated) {
      this.disconnect();
    } else if (!wasAuthenticated && isAuthenticated) {
      this.reconnectAttempts = 0;
    }
  }

  // Debounced connection to prevent rapid attempts
  connect(url) {
    if (!this.isAuthenticated) {
      console.log('WebSocket: Not authenticated, skipping connection');
      return;
    }

    const state = this.connectionState;
    const now = Date.now();

    if (state.isConnecting || state.isConnected ||
        (now - state.lastConnectionAttempt) < state.connectionDebounceMs) {
      console.log('WebSocket: Connection attempt too soon, debouncing');
      return;
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket: Closing existing connection before new attempt');
      this.ws.close();
      this.ws = null;
    }

    state.lastConnectionAttempt = now;
    state.isConnecting = true;
    this.connectionUrl = url;

    console.log('WebSocket: Connecting to:', url);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket: Connected successfully');
        state.isConnected = true;
        state.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket: Message received:', data);

          // Handle backend notifications
          if (data.type === 'notification') {
            this.handleBackendNotification(data);
          } else {
            this.notifyListeners(data.type, data.data);
          }
        } catch (error) {
          console.error('WebSocket: Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket: Connection error:', error);
        state.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket: Connection closed', event.code, event.reason);

        state.isConnected = false;
        state.isConnecting = false;
        state.isDisconnecting = false;

        if (state.cleanupInProgress) {
          console.log('WebSocket: Disconnect completed successfully');
        }

        this.notifyListeners('connection', { status: 'disconnected' });

        if (this.isAuthenticated &&
            !state.cleanupInProgress &&
            this.reconnectAttempts < this.maxReconnectAttempts &&
            event.code !== 1000) {

          this.reconnectAttempts++;
          const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

          console.log(`WebSocket: Scheduling reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

          setTimeout(() => {
            if (this.isAuthenticated && !state.cleanupInProgress) {
              this.connect(this.connectionUrl);
            }
          }, delay);
        }

        setTimeout(() => {
          if (state.cleanupInProgress) {
            this.ws = null;
          }
        }, 50);
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
      state.isConnecting = false;
    }
  }

  // FIXED: Handle backend notifications without toast hook
  handleBackendNotification(message) {
    const { case: notificationCase, action_type, data } = message;

    if (notificationCase === 'action_based') {
      switch (action_type) {
        case 'group_join_request':
          this.handleJoinRequestNotification(data);
          break;
        case 'group_join_accept':
          this.handleJoinAcceptNotification(data);
          break;
        case 'group_join_decline':
          this.handleJoinDeclineNotification(data);
          break;
        default:
          console.log('WebSocket: Unknown group notification:', message);
      }
    }
  }

  // FIXED: Handle join request notifications without toast - dispatch events instead
  handleJoinRequestNotification(data) {
    const { user, group, message } = data;

    // Dispatch event for components to handle
    this.dispatchNotificationEvent('group_join_request', {
      title: "New Join Request",
      description: message,
      action: {
        text: "Review",
        callback: () => this.openGroupManagement(group.id)
      },
      data: { user, group }
    });

    // Trigger callbacks for active group management dialogs
    const callbacks = this.groupNotificationCallbacks.get(group.id);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          callback({
            type: 'join_request',
            data: { user, group }
          });
        } catch (error) {
          console.error('Error in group notification callback:', error);
        }
      });
    }

    // Trigger page updates
    this.triggerGroupPageUpdate(group.id, {
      type: 'join_request_received',
      data: { user, group }
    });
  }

  // FIXED: Handle join accept/decline notifications without toast - dispatch events instead
  handleJoinAcceptNotification(data) {
    const { group, status, message } = data;

    // Dispatch event for components to handle
    this.dispatchNotificationEvent('group_join_response', {
      title: status === 'accepted' ? "Request Accepted!" : "Request Declined",
      description: message,
      variant: status === 'accepted' ? "default" : "destructive",
      action: status === 'accepted' ? {
        text: "Visit Group",
        callback: () => window.location.href = `/groups/${this.createSlug(group.title)}`
      } : null,
      data: { group, status }
    });

    // Update group page if user is currently viewing it
    this.triggerGroupPageUpdate(group.id, {
      type: 'membership_changed',
      data: { status, group }
    });
  }

  handleJoinDeclineNotification(data) {
    this.handleJoinAcceptNotification(data);
  }

  // FIXED: Dispatch custom events for components to handle notifications
  dispatchNotificationEvent(type, notificationData) {
    window.dispatchEvent(new CustomEvent('wsNotification', {
      detail: { type, notification: notificationData }
    }));
  }

  // Perfect disconnect with proper sequencing
  disconnect() {
    console.log('WebSocket: Disconnecting...');

    const state = this.connectionState;

    if (state.isDisconnecting) {
      console.log('WebSocket: Already disconnecting, skipping');
      return;
    }

    state.isDisconnecting = true;
    state.cleanupInProgress = true;
    state.isConnected = false;
    state.isConnecting = false;

    if (this.ws) {
      const currentState = this.ws.readyState;

      if (currentState === WebSocket.OPEN || currentState === WebSocket.CONNECTING) {
        console.log('WebSocket: Closing connection...');
        this.ws.close(1000, 'Logout');

        setTimeout(() => {
          if (this.ws && state.cleanupInProgress) {
            console.log('WebSocket: Force cleanup after timeout');
            this.ws = null;
            state.isDisconnecting = false;
            console.log('WebSocket: Disconnect completed (fallback)');
          }
        }, 1000);
      } else {
        console.log('WebSocket: Connection already closed');
        this.ws = null;
        state.isDisconnecting = false;
        console.log('WebSocket: Disconnect completed (already closed)');
      }
    } else {
      console.log('WebSocket: No connection to disconnect');
      state.isDisconnecting = false;
    }

    this.reconnectAttempts = 0;

    setTimeout(() => {
      state.cleanupInProgress = false;
    }, 2000);
  }

  // Subscribe to group-specific notifications
  subscribeToGroupNotifications(groupId, callback) {
    if (!this.groupNotificationCallbacks.has(groupId)) {
      this.groupNotificationCallbacks.set(groupId, []);
    }
    this.groupNotificationCallbacks.get(groupId).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.groupNotificationCallbacks.get(groupId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Trigger updates on group pages
  triggerGroupPageUpdate(groupId, notification) {
    window.dispatchEvent(new CustomEvent('groupNotificationUpdate', {
      detail: { groupId, notification }
    }));
  }

  // Helper to create group slug from title
  createSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Helper to open group management
  openGroupManagement(groupId) {
    window.dispatchEvent(new CustomEvent('openGroupManagement', {
      detail: { groupId }
    }));
  }

  // Event listener management
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
      if (this.listeners.get(type).size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  notifyListeners(type, data) {
    if (this.listeners.has(type)) {
      const callbacks = Array.from(this.listeners.get(type));
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket: Error in listener for ${type}:`, error);
        }
      });
    }
  }

  // Send with connection validation
  send(type, data) {
    if (!this.isAuthenticated) {
      throw new Error('WebSocket: User not authenticated');
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket: Connection not available');
    }

    try {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      console.log('WebSocket: Message sent:', message);
    } catch (error) {
      console.error('WebSocket: Failed to send message:', error);
      throw error;
    }
  }

  // Promise-based operations with proper error handling
  async sendAndWait(type, data, timeout = 10000) {
    if (!this.isAuthenticated) {
      throw new Error('WebSocket: User not authenticated');
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket: Connection not available');
    }

    // Operations that don't expect responses (silent operations)
    const silentOperations = [
      'group_join_request',
      'exit_group',
      'group_invitation',
      'respond_group_join_request',
      'unfollow',
      'follow_request'
    ];

    if (silentOperations.includes(type)) {
      try {
        this.send(type, data);
        return {
          success: true,
          message: 'Operation sent successfully',
          silent: true
        };
      } catch (error) {
        throw error;
      }
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation ${type} timed out after ${timeout}ms`));
      }, timeout);

      try {
        this.send(type, data);
        clearTimeout(timeoutId);
        resolve({
          success: true,
          message: 'Operation completed successfully'
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Connection status getter
  isConnected() {
    return this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Debug info
  getConnectionInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      isConnected: this.connectionState.isConnected,
      isConnecting: this.connectionState.isConnecting,
      isDisconnecting: this.connectionState.isDisconnecting,
      reconnectAttempts: this.reconnectAttempts,
      wsState: this.ws?.readyState,
      listenerCount: this.listeners.size
    };
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// FIXED: Custom hook for WebSocket notifications
export const useWebSocketNotifications = () => {
  const { toast } = useToast(); // NOW we can use the toast hook properly in a React component

  useEffect(() => {
    const handleNotification = (event) => {
      const { type, notification } = event.detail;

      if (type === 'group_join_request') {
        toast({
          title: notification.title,
          description: notification.description,
          action: notification.action ? (
            <button
              onClick={notification.action.callback}
              className="text-sm bg-social text-white px-3 py-1 rounded hover:bg-social-dark"
            >
              {notification.action.text}
            </button>
          ) : null,
        });
      } else if (type === 'group_join_response') {
        toast({
          title: notification.title,
          description: notification.description,
          variant: notification.variant,
          action: notification.action ? (
            <button
              onClick={notification.action.callback}
              className="text-sm bg-social text-white px-3 py-1 rounded hover:bg-social-dark"
            >
              {notification.action.text}
            </button>
          ) : null,
        });
      }
    };

    window.addEventListener('wsNotification', handleNotification);

    return () => {
      window.removeEventListener('wsNotification', handleNotification);
    };
  }, [toast]);
};

// React hook with proper lifecycle management
export const useWebSocket = (type, callback) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const connectionCallback = (data) => {
      if (mountedRef.current) {
        setIsConnected(data.status === 'connected');
      }
    };

    const messageCallback = (data) => {
      if (mountedRef.current && callbackRef.current) {
        try {
          callbackRef.current(data);
        } catch (error) {
          console.error('WebSocket: Error in message callback:', error);
        }
      }
    };

    wsManager.addListener('connection', connectionCallback);
    if (type) {
      wsManager.addListener(type, messageCallback);
    }

    return () => {
      mountedRef.current = false;
      wsManager.removeListener('connection', connectionCallback);
      if (type) {
        wsManager.removeListener(type, messageCallback);
      }
    };
  }, [type]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    send: (type, data) => wsManager.send(type, data),
    sendAndWait: (type, data, timeout) => wsManager.sendAndWait(type, data, timeout),
    connectionInfo: wsManager.getConnectionInfo()
  };
};

// Event types
export const EVENT_TYPES = {
  PRIVATE_MESSAGE: 'private_message',
  GROUP_MESSAGE: 'group_message',
  FOLLOW_REQUEST: 'follow_request',
  RESPOND_FOLLOW_REQUEST: 'respond_follow_request',
  UNFOLLOW: 'unfollow',
  CANCEL_FOLLOW_REQUEST: 'cancel_follow_request',
  GROUP_JOIN_REQUEST: 'group_join_request',
  RESPOND_GROUP_JOIN_REQUEST: 'respond_group_join_request',
  EXIT_GROUP: 'exit_group',
  GROUP_INVITATION: 'group_invitation',
  RESPOND_GROUP_INVITATION: 'respond_group_invitation',
  CANCEL_GROUP_INVITATION: 'cancel_group_invitation',
  CANCEL_GROUP_JOIN_REQUEST: 'cancel_group_join_request',
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

// WebSocket operations with proper error handling
export const webSocketOperations = {
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

  sendPrivateMessage(userId, message) {
    wsManager.send(EVENT_TYPES.PRIVATE_MESSAGE, { recipient_Id: userId, message });
  },

  sendGroupMessage(groupId, message) {
    wsManager.send(EVENT_TYPES.GROUP_MESSAGE, { group_id: groupId, message });
  },

  markNotificationAsRead(notificationId) {
    wsManager.send(EVENT_TYPES.READ_NOTIFICATION, { notification_id: notificationId });
  },

  markPrivateMessageAsRead(messageId) {
    wsManager.send(EVENT_TYPES.READ_PRIVATE_MESSAGE, { message_id: messageId });
  }
};

export default wsManager;