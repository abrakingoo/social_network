'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket, EVENT_TYPES, webSocketOperations, wsManager } from '@/utils/websocket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GroupChat = ({ groupId, groupData }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef(null);

  // Separate WebSocket connection for real-time group messages
  const { isConnected } = useWebSocket(
    EVENT_TYPES.GROUP_MESSAGE,
    useCallback((data) => {
      // Handle real-time group messages from backend
      try {
        const messageData = typeof data === 'string' ? JSON.parse(data) : data;
        const newMessage = {
          id: Date.now().toString(),
          group_id: groupId,
          sender_id: messageData.sender?.id || messageData.sender?.ID,
          content: messageData.message,
          created_at: new Date().toISOString(),
          sender: {
            id: messageData.sender?.id || messageData.sender?.ID,
            ID: messageData.sender?.id || messageData.sender?.ID,
            firstname: messageData.sender?.firstname || messageData.sender?.first_name,
            lastname: messageData.sender?.lastname || messageData.sender?.last_name,
            nickname: messageData.sender?.nickname,
            avatar: messageData.sender?.avatar
          }
        };
        setMessages(prev => [...prev, newMessage]);
      } catch (error) {
        console.error('Error parsing group message:', error);
      }
    }, [groupId])
  );

  // Load messages when component mounts or reconnects
  useEffect(() => {
    if (!groupId) return;

    // Check WebSocket manager connection status directly
    const wsConnected = wsManager.isConnected();
    if (!wsConnected) {
      // Retry after a short delay if not connected
      const timer = setTimeout(() => {
        if (wsManager.isConnected()) {
          loadGroupMessages();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    loadGroupMessages();
  }, [groupId, isConnected]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGroupMessages = useCallback(async () => {
    if (!groupId) return;

    setIsLoading(true);

    try {
      const data = await webSocketOperations.loadGroupMessages(groupId);

      // Backend sends messages directly in the response, not nested in data.messages
      const messages = data.messages || [];

      // Transform messages to match frontend expectations
      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        group_id: msg.group_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender: {
          id: msg.sender?.id || msg.sender_id,
          ID: msg.sender?.id || msg.sender_id,
          firstname: msg.sender?.firstname,
          lastname: msg.sender?.lastname,
          nickname: msg.sender?.nickname,
          avatar: msg.sender?.avatar
        }
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading group messages:', error);
      toast.error('Failed to load group messages: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (message.trim() === '' || isSending) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    // Optimistic UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      group_id: groupId,
      sender_id: currentUser?.id || currentUser?.ID,
      content: messageText,
      created_at: new Date().toISOString(),
      sending: true,
      sender: {
        id: currentUser?.id || currentUser?.ID,
        ID: currentUser?.id || currentUser?.ID,
        firstname: currentUser?.firstName || currentUser?.first_name,
        lastname: currentUser?.lastName || currentUser?.last_name,
        nickname: currentUser?.nickname,
        avatar: currentUser?.avatar
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      webSocketOperations.sendGroupMessage(groupId, messageText);

      // Remove sending status after a short delay
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMessage.id
              ? { ...msg, sending: false, id: Date.now().toString() }
              : msg
          )
        );
      }, 1000);

    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending group message:', error);

      // Remove failed message
      setMessages(prev =>
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
            <p className="text-gray-500">Be the first to send a message in this group!</p>
          </div>
        </div>
      );
    }

    return messages.map((msg, index) => {
      const isCurrentUser = msg.sender_id === (currentUser?.id || currentUser?.ID);
      const showDate = index === 0 ||
        new Date(messages[index - 1]?.created_at).toDateString() !== new Date(msg.created_at).toDateString();

      const senderName = msg.sender?.nickname ||
        `${msg.sender?.firstname || msg.sender?.first_name || ''} ${msg.sender?.lastname || msg.sender?.last_name || ''}`.trim() ||
        'Unknown User';

      return (
        <div key={msg.id}>
          {showDate && (
            <div className="flex justify-center my-4">
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(msg.created_at)}
              </span>
            </div>
          )}

          <div className={`flex items-start space-x-3 mb-4 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.sender?.avatar} />
              <AvatarFallback>
                {(msg.sender?.firstname?.[0] || msg.sender?.first_name?.[0] || '?').toUpperCase()}
                {(msg.sender?.lastname?.[0] || msg.sender?.last_name?.[0] || '').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-sm font-medium ${isCurrentUser ? 'order-2' : ''}`}>
                  {isCurrentUser ? 'You' : senderName}
                </span>
                <span className={`text-xs text-gray-500 ${isCurrentUser ? 'order-1' : ''}`}>
                  {formatTime(msg.created_at)}
                </span>
                {msg.sending && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </div>

              <div className={`inline-block px-4 py-2 rounded-lg max-w-xs break-words ${
                isCurrentUser
                  ? 'bg-social text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${msg.sending ? 'opacity-70' : ''}`}>
                {msg.content}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to join the group chat.</p>
      </div>
    );
  }

  if (!groupData?.is_joined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-4">
          <h3 className="text-lg font-medium mb-2">Join the group to chat</h3>
          <p className="text-gray-500">You need to be a member of this group to participate in the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Group Chat</h3>
        <p className="text-sm text-gray-500">
          {groupData?.members_count || groupData?.members?.length || 0} members
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-social" />
            <span className="ml-2 text-sm text-gray-600">Loading messages...</span>
          </div>
        ) : (
          <>
            {renderMessages()}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-social hover:bg-social-dark rounded-full h-10 w-10 p-0 flex items-center justify-center"
            disabled={isSending || message.trim() === ''}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;