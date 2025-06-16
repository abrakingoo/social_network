
import { useEffect, useRef, useState } from 'react';

//  Rock-solid WebSocket manager
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isAuthenticated = false;
    this.connectionUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 3000;

    //  Connection state management
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      lastConnectionAttempt: 0,
      connectionDebounceMs: 200, // Prevent rapid connection attempts
      cleanupInProgress: false
    };
  }

  //  Auth state with connection stability
  setAuthState(isAuthenticated) {
    console.log(`WebSocket: Setting auth state to ${isAuthenticated}`);

    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = isAuthenticated;

    if (wasAuthenticated && !isAuthenticated) {
      // User logged out - immediate disconnect
      this.disconnect();
    } else if (!wasAuthenticated && isAuthenticated) {
      // User logged in - reset connection attempts
      this.reconnectAttempts = 0;
    }
  }

  //  Debounced connection to prevent rapid attempts
  connect(url) {
    if (!this.isAuthenticated) {
      console.log('WebSocket: Not authenticated, skipping connection');
      return;
    }

    const state = this.connectionState;
    const now = Date.now();

    // Prevent rapid connection attempts
    if (state.isConnecting || state.isConnected ||
        (now - state.lastConnectionAttempt) < state.connectionDebounceMs) {
      console.log('WebSocket: Connection attempt too soon, debouncing');
      return;
    }

    // Clear any existing connection first
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
          this.notifyListeners(data.type, data.data);
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
        this.ws = null;

        this.notifyListeners('connection', { status: 'disconnected' });

        //  Smart reconnection logic
        if (this.isAuthenticated &&
            !state.cleanupInProgress &&
            this.reconnectAttempts < this.maxReconnectAttempts &&
            event.code !== 1000) { // Don't reconnect on normal closure

          this.reconnectAttempts++;
          const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff

          console.log(`WebSocket: Scheduling reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

          setTimeout(() => {
            if (this.isAuthenticated && !state.cleanupInProgress) {
              this.connect(this.connectionUrl);
            }
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('WebSocket: Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
      state.isConnecting = false;
    }
  }

  //  Clean disconnect with proper state management
  disconnect() {
    console.log('WebSocket: Disconnecting...');

    const state = this.connectionState;
    state.cleanupInProgress = true;
    state.isConnected = false;
    state.isConnecting = false;

    if (this.ws) {
      // Remove event handlers to prevent callbacks
      const ws = this.ws;
      this.ws = null;

      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Logout'); // Normal closure
      }
    }

    this.reconnectAttempts = 0;

    // Reset cleanup flag after a short delay
    setTimeout(() => {
      state.cleanupInProgress = false;
    }, 100);
  }

  //  Robust event listener management
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
      // Clean up empty listener sets
      if (this.listeners.get(type).size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  notifyListeners(type, data) {
    if (this.listeners.has(type)) {
      // Create array copy to prevent modification during iteration
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

  //  Send with connection validation
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

  //  Promise-based operations with proper error handling
  async sendAndWait(type, data, timeout = 10000) {
    if (!this.isAuthenticated) {
      throw new Error('WebSocket: User not authenticated');
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket: Connection not available');
    }

    // Operations that typically don't send responses from backend
    const silentOperations = [
      'group_join_request',
      'exit_group',
      'group_invitation',
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

    // For operations that might have responses, implement proper waiting
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation ${type} timed out after ${timeout}ms`));
      }, timeout);

      try {
        this.send(type, data);

        // For now, resolve immediately since most operations are fire-and-forget
        // In the future, you can implement proper response matching here
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

  //  Connection status getter
  isConnected() {
    return this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  //  Get connection info for debugging
  getConnectionInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      isConnected: this.connectionState.isConnected,
      isConnecting: this.connectionState.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      wsState: this.ws?.readyState,
      listenerCount: this.listeners.size
    };
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

//  React hook with proper lifecycle management
export const useWebSocket = (type, callback) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  //  Single effect with proper cleanup
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

    // Add listeners
    wsManager.addListener('connection', connectionCallback);
    if (type) {
      wsManager.addListener(type, messageCallback);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      wsManager.removeListener('connection', connectionCallback);
      if (type) {
        wsManager.removeListener(type, messageCallback);
      }
    };
  }, [type]);

  // Mark as unmounted on cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    send: (type, data) => wsManager.send(type, data),
    sendAndWait: (type, data, timeout) => wsManager.sendAndWait(type, data, timeout),
    connectionInfo: wsManager.getConnectionInfo() // For debugging
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

//  WebSocket operations with proper error handling
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