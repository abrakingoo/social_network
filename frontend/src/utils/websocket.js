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
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.connect(url), this.reconnectInterval);
      } else {
        console.error('Max reconnect attempts reached. Could not reconnect to WebSocket.');
      }
    };
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

  // Send message through WebSocket
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      console.log('WebSocket message sent:', message);
    } else {
      console.error('WebSocket is not connected');
    }
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
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws';
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

  return { isConnected, send: (type, data) => wsManager.send(type, data) };
};

// Supported event types for reference
export const EVENT_TYPES = {
  PRIVATE_MESSAGE: 'private_message',
  GROUP_MESSAGE: 'group_message',
  NOTIFICATION_LIKE: 'like',
  NOTIFICATION_COMMENT: 'comment',
  NOTIFICATION_FOLLOW_REQUEST: 'follow_request',
  NOTIFICATION_FOLLOW_ACCEPT: 'follow_accept',
  NOTIFICATION_GROUP_INVITE: 'group_invite',
  NOTIFICATION_GROUP_JOIN_REQUEST: 'group_join_request',
  NOTIFICATION_GROUP_JOIN_ACCEPT: 'group_join_accept',
  NOTIFICATION_EVENT_CREATE: 'event_create',
  NOTIFICATION_EVENT_RESPONSE: 'event_response',
};
