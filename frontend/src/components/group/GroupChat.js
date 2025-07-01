'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EVENT_TYPES, webSocketOperations, wsManager } from '@/utils/websocket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker from '@/components/ui/emoji-picker';
import { decode } from 'he';

const GroupChat = ({ groupId, groupData }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef(null);
  const groupIdRef = useRef(groupId);
  const messageRef = useRef(message);
  const currentUserRef = useRef(currentUser);

  // Keep refs updated
  useEffect(() => {
    groupIdRef.current = groupId;
    messageRef.current = message;
    currentUserRef.current = currentUser;
  }, [groupId, message, currentUser]);

  // Stable WebSocket message handler
  const handleGroupMessage = useCallback((data) => {
    try {
      const messageData = typeof data === 'string' ? JSON.parse(data) : data;
      if (messageData.group_id !== groupIdRef.current) return;

      const newMessage = {
        id: Date.now().toString(),
        group_id: groupIdRef.current,
        sender_id: messageData.sender?.id || messageData.sender?.ID,
        content: messageData.message || '',
        created_at: new Date().toISOString(),
        sender: {
          id: messageData.sender?.id || messageData.sender?.ID,
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
  }, []);

  // WebSocket setup
  useEffect(() => {
    wsManager.addListener(EVENT_TYPES.GROUP_MESSAGE, handleGroupMessage);
    return () => wsManager.removeListener(EVENT_TYPES.GROUP_MESSAGE, handleGroupMessage);
  }, [groupId, handleGroupMessage]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);

    try {
      const data = await webSocketOperations.loadGroupMessages(groupId);
      const transformedMessages = (data.messages || []).map(msg => ({
        id: msg.id,
        group_id: msg.group_id,
        sender_id: msg.sender_id,
        content: decode(msg.content || ''),
        created_at: msg.created_at,
        sender: {
          id: msg.sender?.id || msg.sender_id,
          firstname: msg.sender?.firstname,
          lastname: msg.sender?.lastname,
          nickname: msg.sender?.nickname,
          avatar: msg.sender?.avatar
        }
      }));
      setMessages(transformedMessages);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send message
  const handleSend = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!messageRef.current.trim() || isSending) return;

    const messageText = messageRef.current.trim();
    setMessage('');
    setIsSending(true);

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      group_id: groupIdRef.current,
      sender_id: currentUserRef.current?.id || currentUserRef.current?.ID,
      content: messageText,
      created_at: new Date().toISOString(),
      sending: true,
      sender: {
        id: currentUserRef.current?.id || currentUserRef.current?.ID,
        firstname: currentUserRef.current?.firstName || currentUserRef.current?.first_name,
        lastname: currentUserRef.current?.lastName || currentUserRef.current?.last_name,
        nickname: currentUserRef.current?.nickname,
        avatar: currentUserRef.current?.avatar
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      webSocketOperations.sendGroupMessage(groupIdRef.current, messageText);
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id ? { ...msg, sending: false, id: Date.now().toString() } : msg
        ));
      }, 1000);
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  // Input handlers
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    setMessage(prev => prev + emoji);
  }, []);

  // Date formatter
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Current user ID
  const currentUserId = useMemo(() => currentUser?.id || currentUser?.ID, [currentUser]);

  // Render messages
  const renderedMessages = useMemo(() => {
    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
            <p className="text-gray-500">Send the first message!</p>
          </div>
        </div>
      );
    }

    return messages.map((msg) => {
      const isCurrentUser = msg.sender_id === currentUserId;
      const senderName = msg.sender?.nickname ||
        `${msg.sender?.firstname || ''} ${msg.sender?.lastname || ''}`.trim() ||
        'Unknown User';

      return (
        <div key={msg.id} className={`flex items-start mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {!isCurrentUser && (
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={msg.sender?.avatar} />
              <AvatarFallback>
                {(msg.sender?.firstname?.[0] || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className={`flex flex-col max-w-xs ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <span className="text-sm font-medium">
                {isCurrentUser ? 'You' : senderName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(msg.created_at)}
              </span>
              {msg.sending && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
            </div>

            <div className={`px-4 py-2 rounded-lg break-words ${
              isCurrentUser
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            } ${msg.sending ? 'opacity-70' : ''}`}>
              {msg.content}
            </div>
          </div>

          {isCurrentUser && (
            <Avatar className="h-8 w-8 ml-3">
              <AvatarImage src={msg.sender?.avatar} />
              <AvatarFallback>
                {(msg.sender?.firstname?.[0] || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      );
    });
  }, [messages, currentUserId, formatTime]);

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
          <p className="text-gray-500">You need to be a member of this group to participate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border">
      {/* Simple Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Group Chat</h3>
        <p className="text-sm text-gray-500">
          {groupData?.members_count || groupData?.members?.length || 0} members
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {renderedMessages}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <Button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSending || !message.trim()}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;