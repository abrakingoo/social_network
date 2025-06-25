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
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState([]);
  const [prevMessages, setPreviousMessages] = useState([]);
  const [uuid, setUuid] = useState("");
  const [newMsgs, setNewMsgs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Real-time message handling
  useWebSocket(EVENT_TYPES.PRIVATE_MESSAGE, (message) => {
    // Handle incoming messages from the current chat
    if (message.sender.id === uuid) {
      // Message from current chat partner - add to current conversation
      setPreviousMessages(prev => [...prev, {
        id: message.id || Date.now().toString(),
        sender_id: message.sender.id,
        receiver_id: currentUser?.id,
        content: message.message,
        created_at: new Date().toISOString(),
        is_read: false
      }]);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } else {
      // Message from other users - add to new messages for notifications
      setNewMsgs((prev) => [...prev, message]);
    }
  });

  // Listen for connection events to track online status
  useWebSocket("connection", (data) => {
    if (data.status === "connected") {
      setConnectionStatus('connected');
      setRetryCount(0);
      console.log("Connected to WebSocket");
    } else if (data.status === "disconnected") {
      setConnectionStatus('disconnected');
      console.log("Disconnected from WebSocket");
    }
  });

  // Retry failed messages
  const retryFailedMessage = useCallback(async (messageId, userId, content) => {
    try {
      // Remove failed flag and add sending flag
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, failed: false, sending: true }
            : msg
        )
      );

      // Retry sending
      webSocketOperations.sendPrivateMessage(userId, content);

      // Update status
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, sending: false }
            : msg
        )
      );
    } catch (error) {
      // Mark as failed again
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
  }, [toast]);

  const prevMsg = async (userid, idx) => {
    setLoadingMessages(true);
    setMessageError(null);

    try {
      const data = await webSocketOperations.loadPreviousMessages(userid);
      if (data.messages != null) {
        // Sort messages by timestamp to ensure proper order
        const sortedMessages = data.messages.sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );
        setPreviousMessages(sortedMessages);
      } else {
        setPreviousMessages([]);
      }
      setUuid(userid);
      setSelectedChat(idx);

      // Scroll to bottom after messages load
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessageError("Failed to load messages. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const resetPrevMessages = () => {
    setPreviousMessages([]);
    setUuid("");
  };

  // Mark messages as read when viewing a conversation
  const markMessagesAsRead = useCallback(async (senderId) => {
    if (!senderId || senderId === currentUser?.id) return;

    try {
      // Mark all unread messages from this sender as read
      const unreadMessages = prevMessages.filter(msg =>
        msg.sender_id === senderId && !msg.is_read
      );

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
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }, [prevMessages, currentUser?.id]);

  // Simple online status check - user is "online" if they sent a message in last 5 minutes
  const isUserOnline = (userId) => {
    // For now, we'll show online status based on recent activity
    // In a real implementation, this would come from backend WebSocket events
    const recentMessages = prevMessages.filter(msg =>
      msg.sender_id === userId &&
      new Date() - new Date(msg.created_at) < 5 * 60 * 1000 // 5 minutes
    );
    return recentMessages.length > 0 || onlineUsers.has(userId);
  };

  // Get last seen time for a user based on their most recent message
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

  // Authentication check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  // Fetch users on mount
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [prevMessages]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (uuid && prevMessages.length > 0) {
      // Mark messages as read after a short delay to ensure user is actually viewing
      const timer = setTimeout(() => {
        markMessagesAsRead(uuid);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [uuid, prevMessages, markMessagesAsRead]);

  let usersToMessage = [];

  if (users.followers != null) {
    usersToMessage = [...users.followers];
  }

  if (users.following != null) {
    usersToMessage = [...usersToMessage, ...users.following];
  }

  // Enhanced conversation data with last message and unread count
  const getConversationData = (user) => {
    // Get all messages for this user (both sent and received)
    const userMessages = prevMessages.filter(msg =>
      msg.sender_id === user.id || msg.receiver_id === user.id
    );

    // Get last message
    const lastMessage = userMessages.length > 0
      ? userMessages[userMessages.length - 1]
      : null;

    // Count unread messages from this user
    const unreadCount = userMessages.filter(msg =>
      msg.sender_id === user.id && !msg.is_read
    ).length;

    return {
      ...user,
      lastMessage: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage?.created_at || user.created_at,
      unreadCount,
      hasUnread: unreadCount > 0
    };
  };

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const parseDate = (input) => {
    if (input instanceof Date) {
      return input;
    }
    return new Date(input);
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
    e.preventDefault();
    if (message.trim() === "") return;

    const messageText = message.trim();
    const tempId = Date.now().toString();

    // Immediately add message to UI for instant feedback
    const optimisticMessage = {
      id: tempId,
      sender_id: currentUser?.id,
      receiver_id: uuid,
      content: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      sending: true // Flag to show sending status
    };

    setPreviousMessages(prev => [...prev, optimisticMessage]);
    setMessage("");

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(), 100);

    try {
      // Send message via WebSocket
      webSocketOperations.sendPrivateMessage(uuid, messageText);

      // Update the optimistic message to remove sending status
      setPreviousMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, sending: false }
            : msg
        )
      );
    } catch (error) {
      // Handle error - mark message as failed
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

  // Enhanced chat list with conversation data
  const enhancedChats = usersToMessage.map(getConversationData);

  // Filter and sort chats based on search query and last message time
  const filteredChats = enhancedChats
    .filter((user) =>
      (user.firstname + " " + user.lastname)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by unread messages first, then by last message time
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

  return (
    <div className={`h-[calc(100vh-120px)] ${isMobile ? "-mx-4" : ""}`}>
      <div
        className={`h-full ${isMobile ? "rounded-none shadow-none" : "border border-gray-200 rounded-lg shadow-sm"}`}
      >
        <div className="h-full flex">
          {/* Chat List - Hidden on mobile when a chat is selected */}
          <div
            className={`${isMobile && prevMessages ? "hidden" : "block"} md:block w-full md:w-72 ${!isMobile && "border-r border-gray-200"} flex-shrink-0 flex flex-col`}
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
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50
                    ${selectedChat === chat.id ? "bg-gray-100" : ""}
                    ${chat.unread ? "font-medium" : ""}
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
                    {/* Online status indicator */}
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
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${chat.hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage}
                      </p>
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

          {/* Chat Window - Hidden on mobile when no chat is selected */}
          <div
            className={`${isMobile && !prevMessages ? "hidden" : "flex"} md:flex flex-1 flex-col md:max-w-[calc(100%-18rem)] ${isMobile && prevMessages ? "fixed inset-0 z-50" : "border-l border-gray-200"}`}
          >
            {uuid ? (
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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loadingMessages && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-social"></div>
                      <span className="ml-2 text-gray-500">Loading messages...</span>
                    </div>
                  )}

                  {messageError && (
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
                  )}

                  {!loadingMessages && !messageError && prevMessages.map((msg) => (
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
                          {/* Message status indicators for sent messages */}
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
                  <div ref={messageEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className={`border-t border-gray-200 p-3 flex gap-2 bg-white ${!isMobile && "rounded-br-lg"}`}
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full"
                  />
                  <Button
                    type="submit"
                    className="bg-social hover:bg-social-dark rounded-full h-10 w-10 p-0 flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
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
