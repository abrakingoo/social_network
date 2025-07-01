import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { decode } from 'he';

// Enhanced WebSocket manager with EXACT backend integration
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
      cleanupInProgress: false,
    };

    // Group notification management for real-time updates
    this.groupNotificationCallbacks = new Map();
    this.activeGroupManagementDialogs = new Set();
  }

  // Auth state with connection stability
  setAuthState(isAuthenticated) {
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
      return;
    }

    const state = this.connectionState;
    const now = Date.now();

    if (
      state.isConnecting ||
      state.isConnected ||
      now - state.lastConnectionAttempt < state.connectionDebounceMs
    ) {
      return;
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }

    state.lastConnectionAttempt = now;
    state.isConnecting = true;
    this.connectionUrl = url;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        state.isConnected = true;
        state.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyListeners("connection", { status: "connected" });
      };

      this.ws.onmessage = (event) => {
        try {
          // Handle potential multiple JSON messages concatenated together
          let messageData = event.data;

          if (typeof messageData === 'string') {
            // Split by newlines in case backend sends multiple JSON objects separated by newlines
            const lines = messageData.trim().split('\n').filter(line => line.trim());

            if (lines.length > 1) {
              // Process each JSON object separately
              lines.forEach(line => {
                try {
                  const data = JSON.parse(line.trim());
                  this.processMessage(data);
                } catch (parseError) {
                  console.error("WebSocket: Error parsing individual line:", parseError, "Line:", line);
                }
              });
              return;
            }

            // Try to find and handle cases where JSON objects are concatenated without separators
            if (messageData.includes('}{')) {
              // Split on }{ pattern and reconstruct valid JSON
              const parts = messageData.split('}{');
              for (let i = 0; i < parts.length; i++) {
                let jsonStr = parts[i];
                if (i > 0) jsonStr = '{' + jsonStr;
                if (i < parts.length - 1) jsonStr = jsonStr + '}';

                try {
                  const data = JSON.parse(jsonStr);
                  this.processMessage(data);
                } catch (parseError) {
                  console.error("WebSocket: Error parsing split JSON:", parseError, "Part:", jsonStr);
                }
              }
              return;
            }
          }

          // Standard single JSON message processing
          const data = JSON.parse(messageData);
          this.processMessage(data);

        } catch (error) {
          console.error("WebSocket: Error parsing message:", error);
          // Only log raw data in development for debugging
          if (process.env.NODE_ENV === 'development') {
            console.error("WebSocket: Raw message data:", event.data);
            console.error("WebSocket: Message type:", typeof event.data);
            console.error("WebSocket: Message length:", event.data?.length);
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket: Connection error:", error);
        state.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        state.isConnected = false;
        state.isConnecting = false;
        state.isDisconnecting = false;

        if (state.cleanupInProgress) {
        }

        this.notifyListeners("connection", { status: "disconnected" });

        if (
          this.isAuthenticated &&
          !state.cleanupInProgress &&
          this.reconnectAttempts < this.maxReconnectAttempts &&
          event.code !== 1000
        ) {
          this.reconnectAttempts++;
          const delay =
            this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

          console.log(
            `WebSocket: Scheduling reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
          );

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
      console.error("WebSocket: Failed to create connection:", error);
      state.isConnecting = false;
    }
  }

  // Process individual WebSocket messages
  processMessage(data) {
    // Handle backend notifications with EXACT format matching
    if (data.type === "notification") {
      this.handleBackendNotification(data);
    } else if (data.type === "error") {
      // Backend sends errors with exact format: { "type": "error", "message": "..." }
      this.notifyListeners("error", { message: data.message });
    } else if (data.type === "success") {
      // Backend sends success responses with exact format: { "type": "success", "message": "..." }
      this.notifyListeners("success", { message: data.message });
    } else {
      this.notifyListeners(data.type, data.data || data);
    }
  }

  // Handle backend notifications with EXACT format matching
  handleBackendNotification(message) {
    const { case: notificationCase, action_type, data } = message;
    if (notificationCase === "action_based") {
      switch (action_type) {
        case "group_join_request":
          this.handleJoinRequestNotification(message);
          break;
        case "group_join_accept":
          this.handleJoinAcceptNotification(message);
          break;
        case "group_join_decline":
          this.handleJoinDeclineNotification(message);
          break;
        case "group_invitation":
          this.handleGroupInvitationNotification(message);
          break;
        case "private_message":
          this.notifyListeners("notification", message);
          break;
        case "group_message":
          this.handleGroupMessage(message);
          break;
        case "follow_request":
          this.dispatchNotificationEvent("follow_request", {
            title: "follow request",
            description: "new follow_request",
            data: message,
          });
          break;
        
        default:
          break;
      }
     } else if (notificationCase === "group_event") {
       //Handle group event notifications
       this.handleGroupEventNotification(data);
     }
  }

  handlePrivateMessage(data) {
    // Decode HTML entities in the message content
    if (data && data.message) {
      data.message = decode(data.message || '');
    }
    this.notifyListeners(EVENT_TYPES.PRIVATE_MESSAGE, data);
  }

  handleGroupMessage(data) {
    // Decode base64 data if it's a string, then parse JSON
    let decodedData = data;
    if (typeof data === 'string') {
      try {
        // First decode base64 with proper UTF-8 handling
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = new TextDecoder('utf-8').decode(bytes);
        decodedData = JSON.parse(decoded);
      } catch (error) {
        console.error("Failed to decode group message data:", error);
        return;
      }
    }

    // Note: Real-time group messages are sent unescaped from backend
    // Only historical messages from database need HTML entity decoding
    this.notifyListeners(EVENT_TYPES.GROUP_MESSAGE, decodedData);
  }

  // Handle join request notifications matching backend format
  handleJoinRequestNotification(data) {
    const { group_id } = data;

    // Dispatch event for components to handle
    this.dispatchNotificationEvent("group_join_request", {
      title: "New Join Request",
      description: "Someone wants to join your group",
      action: {
        text: "Review",
        callback: () => this.openGroupManagement(group_id),
      },
      data: data,
    });

    // Trigger callbacks for active group management dialogs
    const callbacks = this.groupNotificationCallbacks.get(group_id);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((callback) => {
        try {
          callback({
            type: "join_request",
            data: data,
          });
        } catch (error) {
          console.error("Error in group notification callback:", error);
        }
      });
    }

    // Trigger page updates
    this.triggerGroupPageUpdate(group_id, {
      type: "join_request_received",
      data: data,
    });
  }

  // Handle join accept notifications
  handleJoinAcceptNotification(data) {
    const { group_id } = data;

    // Dispatch event for components to handle
    this.dispatchNotificationEvent("group_join_response", {
      title: "Request Accepted!",
      description: "Your request to join the group was accepted",
      variant: "default",
      action: {
        text: "Visit Group",
        callback: () =>
          (window.location.href = `/groups/${this.createSlug("group-" + group_id)}`),
      },
      data: data,
    });

    // Update group page if user is currently viewing it
    this.triggerGroupPageUpdate(group_id, {
      type: "membership_changed",
      data: { status: "accepted", group_id },
    });
  }

  // Handle join decline notifications
  handleJoinDeclineNotification(data) {
    const { group_id } = data;

    // Dispatch event for components to handle
    this.dispatchNotificationEvent("group_join_response", {
      title: "Request Declined",
      description: "Your request to join the group was declined",
      variant: "destructive",
      data: data,
    });

    // Update group page if user is currently viewing it
    this.triggerGroupPageUpdate(group_id, {
      type: "membership_changed",
      data: { status: "declined", group_id },
    });
  }

  // Handle group invitation notifications
  handleGroupInvitationNotification(data) {
    console.log(data)
    // Dispatch event for components to handle
    this.dispatchNotificationEvent("group_invitation", {
      title: "Group Invitation",
      description: "You've been invited to join a group",
      action: {
        text: "View",
        callback: () => (window.location.href = `/notifications`),
      },
      data: data,
    });
  }

  // Handle group event notifications
  handleGroupEventNotification(data) {
    // Dispatch event for components to handle
    this.dispatchNotificationEvent("group_event", {
      title: "New Event Created",
      description: `Event "${data.title}" has been created`,
      action: {
        text: "View Events",
        callback: () => (window.location.href = `/events`),
      },
      data: data,
    });
  }

  // Dispatch custom events for components to handle notifications
  dispatchNotificationEvent(type, notificationData) {
    window.dispatchEvent(
      new CustomEvent("wsNotification", {
        detail: { type, notification: notificationData },
      }),
    );
  }

  // Perfect disconnect with proper sequencing
  disconnect() {
    const state = this.connectionState;

    if (state.isDisconnecting) {
      return;
    }

    state.isDisconnecting = true;
    state.cleanupInProgress = true;
    state.isConnected = false;
    state.isConnecting = false;

    if (this.ws) {
      const currentState = this.ws.readyState;

      if (
        currentState === WebSocket.OPEN ||
        currentState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000, "Logout");

        setTimeout(() => {
          if (this.ws && state.cleanupInProgress) {
            this.ws = null;
            state.isDisconnecting = false;
          }
        }, 1000);
      } else {
        this.ws = null;
        state.isDisconnecting = false;
      }
    } else {
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
    window.dispatchEvent(
      new CustomEvent("groupNotificationUpdate", {
        detail: { groupId, notification },
      }),
    );
  }

  // Helper to create group slug from title
  createSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Helper to open group management
  openGroupManagement(groupId) {
    window.dispatchEvent(
      new CustomEvent("openGroupManagement", {
        detail: { groupId },
      }),
    );
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
      callbacks.forEach((callback) => {
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
      throw new Error("User not authenticated");
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Connection not available");
    }

    try {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
    } catch (error) {
      console.error("WebSocket: Failed to send message:", error);
      throw error;
    }
  }

  // Handle backend's silent operations properly
  async sendAndWait(type, data, timeout = 8000) {
    if (!this.isAuthenticated) {
      throw new Error("User not authenticated");
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Connection not available");
    }

    // Operations that backend processes silently (no success response)
    const silentOperations = [
      "group_join_request",
      "exit_group",
      "group_invitation",
      "respond_group_join_request",
      "respond_group_invitation",
      "unfollow",
      "follow_request",
      "cancel_group_invitation",
      "cancel_group_join_request",
      "member_group_invitation_proposal",
    ];

    if (silentOperations.includes(type)) {
      return new Promise((resolve, reject) => {
        let resolved = false;
        let errorReceived = false;

        // Listen for errors
        const errorListener = (errorData) => {
          if (!resolved && !errorReceived) {
            errorReceived = true;
            resolved = true;
            this.removeListener("error", errorListener);
            reject(new Error(errorData.message || "Operation failed"));
          }
        };

        this.addListener("error", errorListener);

        // Set timeout for silent success
        const timeoutId = setTimeout(() => {
          if (!resolved && !errorReceived) {
            resolved = true;
            this.removeListener("error", errorListener);
            resolve({
              success: true,
              message: "Operation completed successfully",
              silent: true,
            });
          }
        }, timeout);

        try {
          this.send(type, data);
        } catch (error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            this.removeListener("error", errorListener);
            reject(error);
          }
        }
      });
    }

    // For operations that do send responses - wait for actual response
    return new Promise((resolve, reject) => {
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.removeListener("success", successListener);
          this.removeListener("error", errorListener);
        }
      }, timeout);

      // Listen for success response
      const successListener = (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          this.removeListener("success", successListener);
          this.removeListener("error", errorListener);
          resolve({
            success: true,
            message: data.message || "Operation completed successfully",
          });
        }
      };

      // Listen for error response
      const errorListener = (errorData) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          this.removeListener("success", successListener);
          this.removeListener("error", errorListener);
          reject(new Error(errorData.message || "Operation failed"));
        }
      };

      this.addListener("success", successListener);
      this.addListener("error", errorListener);

      try {
        this.send(type, data);
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          this.removeListener("success", successListener);
          this.removeListener("error", errorListener);
          reject(error);
        }
      }
    });
  }

  // Connection status getter
  isConnected() {
    return (
      this.connectionState.isConnected && this.ws?.readyState === WebSocket.OPEN
    );
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
      listenerCount: this.listeners.size,
    };
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// Custom hook for WebSocket notifications
export const useWebSocketNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleNotification = (event) => {
      const { type, notification } = event.detail;

      if (type === "group_join_request") {
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
      } else if (type === "group_join_response") {
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
      } else if (type === "group_invitation") {
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
      } else if (type === "group_event") {
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
      }
    };

    window.addEventListener("wsNotification", handleNotification);

    return () => {
      window.removeEventListener("wsNotification", handleNotification);
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
        setIsConnected(data.status === "connected");
      }
    };

    const messageCallback = (data) => {
      if (mountedRef.current && callbackRef.current) {
        try {
          callbackRef.current(data);
        } catch (error) {
          console.error("WebSocket: Error in message callback:", error);
        }
      }
    };

    wsManager.addListener("connection", connectionCallback);
    if (type) {
      wsManager.addListener(type, messageCallback);
    }

    return () => {
      mountedRef.current = false;
      wsManager.removeListener("connection", connectionCallback);
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
    sendAndWait: (type, data, timeout) =>
      wsManager.sendAndWait(type, data, timeout),
    connectionInfo: wsManager.getConnectionInfo(),
  };
};

// Event types matching backend exactly
export const EVENT_TYPES = {
  PRIVATE_MESSAGE: "private_message",
  LOAD_PRIVATE_MESSAGES: "load_private_messages",
  GROUP_MESSAGE: "group_message",
  LOAD_GROUP_MESSAGES: "load_group_messages",
  FOLLOW_REQUEST: "follow_request",
  RESPOND_FOLLOW_REQUEST: "respond_follow_request",
  UNFOLLOW: "unfollow",
  CANCEL_FOLLOW_REQUEST: "cancel_follow_request",
  GROUP_JOIN_REQUEST: "group_join_request",
  RESPOND_GROUP_JOIN_REQUEST: "respond_group_join_request",
  EXIT_GROUP: "exit_group",
  GROUP_INVITATION: "group_invitation",
  RESPOND_GROUP_INVITATION: "respond_group_invitation",
  CANCEL_GROUP_INVITATION: "cancel_group_invitation",
  CANCEL_GROUP_JOIN_REQUEST: "cancel_group_join_request",
  READ_NOTIFICATION: "read_notification",
  READ_PRIVATE_MESSAGE: "read_private_message",
  MEMBER_GROUP_INVITATION_PROPOSAL: "member_group_invitation_proposal",
  GROUP_EVENT: "group_event",
};

// WebSocket operations with exact backend payload format
export const webSocketOperations = {
  async joinGroup(groupId) {
    try {
      const result = await wsManager.sendAndWait(
        EVENT_TYPES.GROUP_JOIN_REQUEST,
        {
          group_id: groupId,
        },
      );
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "Request already sent") {
        throw new Error("You have already requested to join this group.");
      } else if (message === "Cannot request to join your own group") {
        throw new Error("You cannot request to join your own group.");
      } else if (message === "User not authenticated") {
        throw new Error("Please log in to join groups.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

  async leaveGroup(groupId) {
    try {
      const result = await wsManager.sendAndWait(EVENT_TYPES.EXIT_GROUP, {
        group_id: groupId,
      });
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "Admins can't exit group") {
        throw new Error(
          "Group administrators cannot leave their own group. Please transfer ownership or delete the group.",
        );
      } else if (message === "Not a member of the group") {
        throw new Error("You are not a member of this group.");
      } else if (message === "User not authenticated") {
        throw new Error("Please log in to leave groups.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

  async inviteToGroup(groupId, userId) {
    try {
      const result = await wsManager.sendAndWait(EVENT_TYPES.GROUP_INVITATION, {
        group_id: groupId,
        recipient_Id: userId,
      });
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "Only group admin can send join invitations") {
        throw new Error("Only group admin can send invitations");
      } else if (message === "User is already a member") {
        throw new Error("User is already a member of this group");
      } else if (message === "User not authenticated") {
        throw new Error("Please log in to send invitations.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

  async respondToGroupInvitation(groupId, status) {
    try {
      const result = await wsManager.sendAndWait(
        EVENT_TYPES.RESPOND_GROUP_INVITATION,
        {
          group_id: groupId,
          status: status,
        },
      );
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "User not authenticated") {
        throw new Error("Please log in to respond to invitations.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

  async respondToJoinRequest(groupId, userId, status) {
    try {
      const result = await wsManager.sendAndWait(
        EVENT_TYPES.RESPOND_GROUP_JOIN_REQUEST,
        {
          group_id: groupId,
          recipient_Id: userId,
          status: status,
        },
      );
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "Only group admin can respond to join requests") {
        throw new Error("Only group admin can respond to join requests");
      } else if (message === "The user is already a member") {
        throw new Error("User is already a member of this group");
      } else if (message === "No request to respond to") {
        throw new Error("No request found to respond to");
      } else if (message === "User not authenticated") {
        throw new Error("Please log in to respond to requests.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

  // Member invitation proposal operation
  async proposeMemberInvitation(groupId, userId) {
    try {
      const result = await wsManager.sendAndWait(
        EVENT_TYPES.MEMBER_GROUP_INVITATION_PROPOSAL,
        {
          group_id: groupId,
          recipient_Id: userId, // Note: Backend expects recipient_Id (capital I)
        },
      );
      return result;
    } catch (error) {
      // Map backend error messages exactly
      const message = error.message;
      if (message === "Only group members can send invitation proposals") {
        throw new Error("Only group members can send invitation proposals");
      } else if (message === "User is already a member") {
        throw new Error("User is already a member of this group");
      } else if (message === "User not authenticated") {
        throw new Error("Please log in to send invitation proposals.");
      } else if (message === "Connection not available") {
        throw new Error(
          "Connection lost. Please refresh the page and try again.",
        );
      }
      throw error;
    }
  },

 sendFollowRequest(userId) {
    return wsManager.sendAndWait(EVENT_TYPES.FOLLOW_REQUEST, {
      recipient_Id: userId,
    });
  },

 respondToFollowRequest(userId, status) {
    return wsManager.sendAndWait(EVENT_TYPES.RESPOND_FOLLOW_REQUEST, {
      recipient_Id: userId,
      status,
    });
  },

 unfollowUser(userId) {
    return wsManager.sendAndWait(EVENT_TYPES.UNFOLLOW, {
      recipient_Id: userId,
    });
  },

  sendPrivateMessage(userId, message) {
    wsManager.send(EVENT_TYPES.PRIVATE_MESSAGE, {
      recipient_Id: userId,
      message,
    });
  },

  sendGroupMessage(groupId, message) {
    wsManager.send(EVENT_TYPES.GROUP_MESSAGE, { group_id: groupId, message });
  },

  markNotificationAsRead(notificationId) {
    wsManager.send(EVENT_TYPES.READ_NOTIFICATION, {
      notification_id: notificationId,
    });
  },

  loadPreviousMessages(userID) {
    return new Promise((resolve, reject) => {
      const listener = (data) => {
        wsManager.removeListener(EVENT_TYPES.LOAD_PRIVATE_MESSAGES, listener);
        resolve(data);
      };

      wsManager.addListener(EVENT_TYPES.LOAD_PRIVATE_MESSAGES, listener);

      try {
        wsManager.send(EVENT_TYPES.LOAD_PRIVATE_MESSAGES, {
          recipient_Id: userID,
        });
      } catch (err) {
        wsManager.removeListener(EVENT_TYPES.LOAD_PRIVATE_MESSAGES, listener);
        reject(err);
      }
    });
  },

  markPrivateMessageAsRead(messageId) {
    wsManager.send(EVENT_TYPES.READ_PRIVATE_MESSAGE, { message_id: messageId });
  },

  cancelFollowRequest(followerId) {
    wsManager.send(EVENT_TYPES.CANCEL_FOLLOW_REQUEST, {
      recipient_Id: followerId,
    });
  },

  // Load group messages
  loadGroupMessages(groupId) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        wsManager.removeListener(EVENT_TYPES.LOAD_GROUP_MESSAGES, listener);
        reject(new Error('Load group messages request timed out'));
      }, 10000); // 10 second timeout

      const listener = (data) => {
        clearTimeout(timeoutId);
        wsManager.removeListener(EVENT_TYPES.LOAD_GROUP_MESSAGES, listener);
        resolve(data);
      };

      wsManager.addListener(EVENT_TYPES.LOAD_GROUP_MESSAGES, listener);

      try {
        wsManager.send(EVENT_TYPES.LOAD_GROUP_MESSAGES, {
          group_id: groupId,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        wsManager.removeListener(EVENT_TYPES.LOAD_GROUP_MESSAGES, listener);
        reject(err);
      }
    });
  },

  // Create event via WebSocket for real-time notifications
  async createEvent(eventData) {
    try {
      const result = await wsManager.sendAndWait(EVENT_TYPES.GROUP_EVENT, eventData);
      return {
        success: true,
        message: result.message || 'Event created successfully'
      };
    } catch (error) {
      console.error('[webSocketOperations.createEvent] Error:', error);
      throw error;
    }
  },
};

export default wsManager;