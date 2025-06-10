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

  