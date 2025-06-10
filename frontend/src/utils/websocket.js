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

  
