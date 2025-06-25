"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE_URL, useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, ArrowLeft, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import {
  EVENT_TYPES,
  useWebSocket,
  webSocketOperations,
} from "@/utils/websocket";

const Messages = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Simple throttle function
  const throttle = (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  };

  // Core state
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState([]);
  const [prevMessages, setPreviousMessages] = useState([]);
  const [conversationPreviews, setConversationPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [uuid, setUuid] = useState("");
  const [newMsgs, setNewMsgs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // 🔥 REMOVED: loadingMessages - we don't use loading states anymore for modern UX
  const [messageError, setMessageError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [allMessages, setAllMessages] = useState([]);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // 🔥 NEW: Optimistic UI state for unread count flicker fix
  const [readingChats, setReadingChats] = useState(new Set());
  const [optimisticReadStates, setOptimisticReadStates] = useState(new Map());

  const messageEndRef = useRef(null);

  // 🔥 OPTIMIZED: Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "auto", // Instant scroll, no animation flash
        block: "end"
      });
    }
  }, []);

  // Real-time message handling with optimistic updates
  useWebSocket(EVENT_TYPES.PRIVATE_MESSAGE, (message) => {
    if (message.sender.id === uuid) {
      // Message from current chat partner - add to current conversation
      const newMessage = {
        id: message.id || Date.now().toString(),
        sender_id: message.sender.id,
        receiver_id: currentUser?.id,
        content: message.message,
        created_at: new Date().toISOString(),
        is_read: false
      };

      setPreviousMessages(prev => [...prev, newMessage]);
      setTimeout(() => scrollToBottom(), 50);

      // 🔥 CRITICAL: Mark as read immediately since user is viewing
      setTimeout(() => markMessagesAsRead(message.sender.id), 100);
    } else {
      // Message from someone else - update conversation preview
      setConversationPreviews(prev => ({
        ...prev,
        [message.sender.id]: {
          content: message.message,
          created_at: new Date().toISOString(),
          sender_id: message.sender.id,
          is_read: false
        }
      }));

      // Add to new messages for notifications
      setNewMsgs((prev) => [...prev, message]);
    }
  });

  // Listen for connection events
  useWebSocket("connection", (data) => {
    if (data.status === "connected") {
      setConnectionStatus('connected');
      setRetryCount(0);
    } else if (data.status === "disconnected") {
      setConnectionStatus('disconnected');
    }
  });

  // Retry failed messages
  const retryFailedMessage = useCallback(async (messageId, userId, content) => {
    try {
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, failed: false, sending: true }
            : msg
        )
      );

      webSocketOperations.sendPrivateMessage(userId, content);

      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, sending: false }
            : msg
        )
      );
    } catch (error) {
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, sending: false, failed: true }
            : msg
        )
      );

      toast({
        title: "Retry failed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const req = await fetch(`${API_BASE_URL}/api/users`, {
        method: "get",
        credentials: "include",
      });

      if (!req.ok) {
        toast({
          title: "Oops!",
          description: "Something went wrong while fetching chats",
        });
        return;
      }

      const res = await req.json();
      setUsers(res.message);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadConversationPreviews = useCallback(async (userList) => {
    if (!userList || userList.length === 0) return;

    setLoadingPreviews(true);
    const previews = {};

    for (const user of userList) {
      try {
        const data = await webSocketOperations.loadPreviousMessages(user.id);
        if (data.messages && data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          previews[user.id] = {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            is_read: lastMessage.is_read
          };
        }
      } catch (error) {
        console.log(`Failed to load preview for user ${user.id}:`, error);
      }
    }

    setConversationPreviews(previews);
    setLoadingPreviews(false);
  }, []);

  // 🔥 ULTRA-MODERN: No loading state - instant like WhatsApp/Telegram
  const prevMsg = async (userid, idx) => {
    // Step 1: 🔥 CRITICAL - Immediately mark chat as "being read" to prevent flicker
    setReadingChats(prev => new Set([...prev, userid]));

    // Step 2: Set conversation immediately (no loading state needed)
    setMessageError(null);
    setPreviousMessages([]); // Clear for clean slate
    setAllMessages([]);
    setUuid(userid);
    setSelectedChat(idx);

    try {
      const data = await webSocketOperations.loadPreviousMessages(userid);

      if (data.messages != null) {
        const sortedMessages = data.messages.sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );

        const recentMessages = sortedMessages.slice(-20);

        // Step 3: Instant update - no loading flags needed
        import('react-dom').then(({ flushSync }) => {
          flushSync(() => {
            setAllMessages(sortedMessages);
            setPreviousMessages(recentMessages);
            setHasMoreMessages(sortedMessages.length > 20);
            // 🔥 REMOVED: loadingMessages - we don't need it anymore!
          });

          requestAnimationFrame(() => {
            scrollToBottom();
          });
        });

      } else {
        // Empty conversation - show immediately
        import('react-dom').then(({ flushSync }) => {
          flushSync(() => {
            setAllMessages([]);
            setPreviousMessages([]);
            setHasMoreMessages(false);
          });
        });
      }

    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessageError("Failed to load messages. Please try again.");

      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetPrevMessages = () => {
    // 🔥 CRITICAL: Clear reading state for current conversation
    if (uuid) {
      setReadingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(uuid);
        return newSet;
      });
    }

    setPreviousMessages([]);
    setAllMessages([]);
    setUuid("");
    setHasMoreMessages(true);
    setSelectedChat(null);
  };

  // 🔥 OPTIMIZED: Better infinite scroll with maintained scroll position
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlderMessages || !hasMoreMessages || allMessages.length === 0) {
      return Promise.resolve();
    }

    setLoadingOlderMessages(true);

    return new Promise((resolve) => {
      const currentlyShown = prevMessages.length;
      const totalMessages = allMessages.length;
      const nextBatch = Math.min(20, totalMessages - currentlyShown);

      if (nextBatch > 0) {
        const startIndex = totalMessages - currentlyShown - nextBatch;
        const olderMessages = allMessages.slice(startIndex, totalMessages - currentlyShown);

        // Batch updates
        import('react-dom').then(({ flushSync }) => {
          flushSync(() => {
            setPreviousMessages(prev => [...olderMessages, ...prev]);
            setHasMoreMessages(startIndex > 0);
            setLoadingOlderMessages(false);
          });
          resolve();
        });
      } else {
        import('react-dom').then(({ flushSync }) => {
          flushSync(() => {
            setHasMoreMessages(false);
            setLoadingOlderMessages(false);
          });
          resolve();
        });
      }
    });
  }, [loadingOlderMessages, hasMoreMessages, allMessages, prevMessages]);

  // 🔥 OPTIMIZED: Better scroll handler with position maintenance
  const throttledScrollHandler = useCallback(
    throttle((e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;

      if (scrollTop < 100 && hasMoreMessages && !loadingOlderMessages) {
        const scrollHeightBefore = scrollHeight;

        loadOlderMessages().then(() => {
          requestAnimationFrame(() => {
            const scrollHeightAfter = e.target.scrollHeight;
            const scrollDiff = scrollHeightAfter - scrollHeightBefore;
            e.target.scrollTop = scrollTop + scrollDiff;
          });
        });
      }
    }, 200),
    [hasMoreMessages, loadingOlderMessages, loadOlderMessages]
  );

  // 🔥 ENHANCED: Mark messages as read with optimistic updates
  const markMessagesAsRead = useCallback(async (senderId) => {
    if (!senderId || senderId === currentUser?.id) return;

    try {
      // Find unread messages from this sender
      const unreadMessages = prevMessages.filter(msg =>
        msg.sender_id === senderId && !msg.is_read
      );

      if (unreadMessages.length === 0) {
        // No unread messages, just remove from reading state
        setReadingChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(senderId);
          return newSet;
        });
        return;
      }

      // Mark messages as read in API
      for (const msg of unreadMessages) {
        webSocketOperations.markPrivateMessageAsRead(msg.id);
      }

      // Update local state
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.sender_id === senderId
            ? { ...msg, is_read: true }
            : msg
        )
      );

      // Update conversation previews
      setConversationPreviews(prev => ({
        ...prev,
        [senderId]: prev[senderId] ? {
          ...prev[senderId],
          is_read: prev[senderId].sender_id === senderId ? true : prev[senderId].is_read
        } : prev[senderId]
      }));

      // 🔥 CRITICAL: Remove from readingChats AFTER marking as read
      setReadingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(senderId);
        return newSet;
      });

    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      // Keep in readingChats on error to prevent flicker
    }
  }, [prevMessages, currentUser?.id]);

  // Online status helpers
  const isUserOnline = (userId) => {
    const recentMessages = prevMessages.filter(msg =>
      msg.sender_id === userId &&
      new Date() - new Date(msg.created_at) < 5 * 60 * 1000 // 5 minutes
    );
    return recentMessages.length > 0 || onlineUsers.has(userId);
  };

  const getLastSeen = (userId) => {
    const userMessages = prevMessages.filter(msg => msg.sender_id === userId);
    if (userMessages.length === 0) return null;

    const lastMessage = userMessages[userMessages.length - 1];
    const lastSeenTime = new Date(lastMessage.created_at);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSeenTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Effects
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  useEffect(() => {
    if (users && Object.keys(users).length > 0) {
      const allUsers = [
        ...(users.followers || []),
        ...(users.following || []),
        ...(users.non_mutual || [])
      ];

      if (allUsers.length > 0) {
        loadConversationPreviews(allUsers);
      }
    }
  }, [users, loadConversationPreviews]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // 🔥 CRITICAL: Mark as read immediately when viewing conversation
  useEffect(() => {
    if (uuid && prevMessages.length > 0) {
      // Mark as read immediately, not with delay
      markMessagesAsRead(uuid);
    }
  }, [uuid, prevMessages, markMessagesAsRead]);

  let usersToMessage = [];

  if (users.followers != null) {
    usersToMessage = [...users.followers];
  }

  if (users.following != null) {
    usersToMessage = [...usersToMessage, ...users.following];
  }

  // 🔥 ENHANCED: getConversationData with optimistic updates
  const getConversationData = (user) => {
    const userMessages = prevMessages.filter(msg =>
      msg.sender_id === user.id || msg.receiver_id === user.id
    );

    let lastMessage = null;
    let unreadCount = 0;

    if (userMessages.length > 0) {
      lastMessage = userMessages[userMessages.length - 1];
      unreadCount = userMessages.filter(msg =>
        msg.sender_id === user.id && !msg.is_read
      ).length;
    } else {
      const preview = conversationPreviews[user.id];
      if (preview) {
        lastMessage = preview;
        unreadCount = preview.sender_id === user.id && !preview.is_read ? 1 : 0;
      }
    }

    // 🔥 CRITICAL FIX: Hide unread count if chat is being read (optimistic update)
    const isBeingRead = readingChats.has(user.id);
    const displayUnreadCount = isBeingRead ? 0 : unreadCount;

    return {
      ...user,
      lastMessage: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage?.created_at || null,
      unreadCount: displayUnreadCount, // ✅ Optimistic update prevents flicker!
      hasUnread: displayUnreadCount > 0
    };
  };

  if (!currentUser) {
    return null;
  }

  const parseDate = (input) => {
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? new Date() : input;
    }
    if (!input) {
      return new Date();
    }
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatTime = (date) => {
    const d = parseDate(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    const d = parseDate(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return formatTime(d);
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (message.trim() === "") return;

    const messageText = message.trim();
    const tempId = Date.now().toString();

    const optimisticMessage = {
      id: tempId,
      sender_id: currentUser?.id,
      receiver_id: uuid,
      content: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      sending: true
    };

    setPreviousMessages(prev => [...prev, optimisticMessage]);
    setMessage("");

    setTimeout(() => scrollToBottom(), 50);

    try {
      webSocketOperations.sendPrivateMessage(uuid, messageText);

      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, sending: false }
            : msg
        )
      );
    } catch (error) {
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, sending: false, failed: true }
            : msg
        )
      );

      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const enhancedChats = usersToMessage.map(getConversationData);

  const filteredChats = enhancedChats
    .filter((user) =>
      (user.firstname + " " + user.lastname)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;

      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;

      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

  // 🔥 MODERN UX: No loading state - instant feel like WhatsApp/Telegram
  const renderMessages = () => {
    // Only show error state if there's actually an error
    if (messageError) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">{messageError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => prevMsg(uuid, selectedChat)}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // 🔥 MODERN: Show beautiful empty state instead of loading
    if (prevMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Start the conversation
          </h3>
          <p className="text-gray-500 text-center max-w-sm">
            {usersToMessage[selectedChat]
              ? `Send a message to begin chatting with ${usersToMessage[selectedChat].firstname}`
              : "Send a message to start the conversation"
            }
          </p>
        </div>
      );
    }

    // Show messages with loading only for infinite scroll (older messages)
    return (
      <>
        {loadingOlderMessages && (
          <div className="flex justify-center items-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-social"></div>
            <span className="ml-2 text-sm text-gray-500">Loading older messages...</span>
          </div>
        )}

        {prevMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id != uuid ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 ${
                msg.sender_id != uuid
                  ? "bg-social text-white rounded-tr-none"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
              }`}
            >
              <p>{msg.content}</p>
              <div className={`flex items-center justify-between mt-1 ${msg.sender_id !== uuid ? "text-white/70" : "text-gray-500"}`}>
                <span className="text-xs">
                  {formatTime(msg.created_at)}
                </span>
                {msg.sender_id === currentUser?.id && (
                  <div className="flex items-center ml-2">
                    {msg.sending && (
                      <Clock className="h-3 w-3 text-gray-400" />
                    )}
                    {msg.failed && (
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 text-red-400" />
                        <button
                          onClick={() => retryFailedMessage(msg.id, uuid, msg.content)}
                          className="ml-1 text-xs text-red-400 hover:text-red-600 underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {!msg.sending && !msg.failed && (
                      <>
                        {msg.is_read ? (
                          <CheckCheck className="h-3 w-3 text-blue-400" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className={`h-[calc(100vh-120px)] ${isMobile ? "-mx-4" : ""}`}>
      <div
        className={`h-full ${isMobile ? "rounded-none shadow-none" : "border border-gray-200 rounded-lg shadow-sm"}`}
      >
        <div className="h-full flex">
          {/* Chat List */}
          <div
            className={`${isMobile && prevMessages.length > 0 ? "hidden" : "block"} md:block w-full md:w-72 ${!isMobile && "border-r border-gray-200"} flex-shrink-0 flex flex-col`}
          >
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-3">Messages</h2>
              <div className="relative">
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat, idx) => (
                <div
                  key={chat.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors
                    ${selectedChat === idx ? "bg-gray-100" : ""}
                    ${chat.hasUnread ? "font-medium" : ""}
                  `}
                  onClick={() => prevMsg(chat.id, idx)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>
                        {chat.firstname[0]}
                        {chat.lastname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      isUserOnline(chat.id) ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`font-medium truncate ${chat.hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {chat.firstname} {chat.lastname}
                      </h3>
                      <span className="text-xs text-gray-500 ml-1 shrink-0">
                        {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${chat.hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage}
                      </p>
                      {/* 🔥 CRITICAL: This now properly hides when chat is clicked thanks to optimistic updates */}
                      {chat.unreadCount > 0 && (
                        <span className="bg-social text-white text-xs rounded-full px-2 py-1 ml-2 shrink-0 min-w-[20px] text-center">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No conversations found
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div
            className={`${isMobile && !prevMessages.length ? "hidden" : "flex"} md:flex flex-1 flex-col md:max-w-[calc(100%-18rem)] ${isMobile && prevMessages.length ? "fixed inset-0 z-50" : "border-l border-gray-200"}`}
          >
            {uuid && usersToMessage[selectedChat] ? (
              <>
                {/* Chat Header */}
                <div
                  className={`flex items-center p-4 border-b border-gray-200 bg-white ${!isMobile && "rounded-tr-lg"}`}
                >
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 p-0 h-8 w-8"
                      onClick={() => resetPrevMessages()}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={usersToMessage[selectedChat].avatar} />
                    <AvatarFallback>
                      {usersToMessage[selectedChat].firstname[0]}
                      {usersToMessage[selectedChat].lastname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="font-medium">
                      {usersToMessage[selectedChat].firstname}{" "}
                      {usersToMessage[selectedChat].lastname}
                    </h3>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        isUserOnline(uuid) ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <p className="text-xs text-gray-500">
                        {isUserOnline(uuid)
                          ? 'Online'
                          : getLastSeen(uuid)
                            ? `Last seen ${getLastSeen(uuid)}`
                            : 'Offline'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                {connectionStatus === 'disconnected' && (
                  <div className="bg-red-50 border-b border-red-200 p-2 text-center">
                    <div className="flex items-center justify-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Connection lost. Messages may not be delivered.
                    </div>
                  </div>
                )}

                {/* Messages Container - KEY OPTIMIZATION */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                  onScroll={throttledScrollHandler}
                  key={uuid} // Force re-render when conversation changes
                >
                  {renderMessages()}
                  <div ref={messageEndRef} />
                </div>

                {/* Message Input */}
                <div className={`border-t border-gray-200 p-3 flex gap-2 bg-white ${!isMobile && "rounded-br-lg"}`}>
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
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-social hover:bg-social-dark rounded-full h-10 w-10 p-0 flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col bg-gray-50">
                <div
                  className={`text-center p-4 max-w-md ${!isMobile && "border border-gray-200 rounded-lg bg-white shadow-sm p-8"}`}
                >
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Your messages</h3>
                  <p className="text-gray-500">
                    Select a conversation from the list to start messaging or
                    search for a specific person.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;