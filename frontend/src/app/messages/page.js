'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL, useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Search, ArrowLeft } from 'lucide-react';

const Messages = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState([]);


  const fetchUsers = async () => {
    const req = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'get',
      credentials: 'include'
    });

    if (!req.ok) {
      toast({
        title: "Oops!",
        description: "Something went wrong while fetching chats",
      });
      return
    }

    const res = await req.json();

    setUsers(res.message);
  }

  // Check if we're on mobile
  useEffect(() => {
    if (!authLoading && !currentUser == null) {
      router.push("/login");
    }

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    fetchUsers();




    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [currentUser, router]);

  let usersToMessage = [];


  if (users.followers != null) {
    usersToMessage = [...users.followers]
  }

  if (users.following != null) {
    usersToMessage = [...usersToMessage, ...users.following]
  }
  console.log(usersToMessage)

  // Mock data
  const mockChats = [
    {
      id: '1',
      user: { id: '101', firstName: 'John', lastName: 'Doe', avatar: null },
      lastMessage: 'Hey, how are you doing?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      unread: true
    },
    {
      id: '2',
      user: { id: '102', firstName: 'Jane', lastName: 'Smith', avatar: null },
      lastMessage: 'Did you see the latest post?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unread: false
    },
    {
      id: '3',
      user: { id: '103', firstName: 'Mike', lastName: 'Johnson', avatar: null },
      lastMessage: 'Thanks for the help!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      unread: false
    }
  ];

  // Mock messages for the selected chat
  const mockMessages = {
    '1': [
      { id: '1-1', text: 'Hey there!', sender: '101', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: '1-2', text: 'Hi! How are you?', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 28) },
      { id: '1-3', text: 'Doing great, thanks for asking. How about you?', sender: '101', timestamp: new Date(Date.now() - 1000 * 60 * 26) },
      { id: '1-4', text: "I'm good too. Just working on some projects.", sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 25) },
      { id: '1-5', text: 'Hey, how are you doing?', sender: '101', timestamp: new Date(Date.now() - 1000 * 60 * 5) }
    ],
    '2': [
      { id: '2-1', text: 'Hello!', sender: '102', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
      { id: '2-2', text: 'Did you see the latest post?', sender: '102', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) }
    ],
    '3': [
      { id: '3-1', text: 'I need some help with my project', sender: '103', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26) },
      { id: '3-2', text: 'Sure, what do you need?', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25) },
      { id: '3-3', text: 'Thanks for the help!', sender: '103', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) }
    ]
  };



  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    // In a real app, this would send the message to the backend
    toast({
      title: "Message sent",
      description: "Your message has been delivered.",
    });

    setMessage('');
  };

  // Filter chats based on search query
  const filteredChats = usersToMessage.filter(user =>
    (user.firstname + ' ' + user.lastname)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Return to chat list on mobile
  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className={`h-[calc(100vh-120px)] ${isMobile ? '-mx-4' : ''}`}>
      <div className={`h-full ${isMobile ? 'rounded-none shadow-none' : 'border border-gray-200 rounded-lg shadow-sm'}`}>
        <div className="h-full flex">
          {/* Chat List - Hidden on mobile when a chat is selected */}
          <div className={`${isMobile && selectedChat ? 'hidden' : 'block'} md:block w-full md:w-72 ${!isMobile && 'border-r border-gray-200'} flex-shrink-0 flex flex-col`}>
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
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50
                    ${selectedChat === chat.id ? 'bg-gray-100' : ''}
                    ${chat.unread ? 'font-medium' : ''}
                  `}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.firstname[0]}{chat.lastname[0]}</AvatarFallback>
                    </Avatar>
                    {chat.unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-social rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{chat.firstname} {chat.lastname}</h3>
                      {/* <span className="text-xs text-gray-500 ml-1 shrink-0">{formatDate(chat.timestamp)}</span> */}
                    </div>
                    {/* <p className={`text-sm truncate ${chat.unread ? 'text-gray-800' : 'text-gray-500'}`}>
                      {chat.lastMessage}
                    </p> */}
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
            className={`${isMobile && !selectedChat ? 'hidden' : 'flex'} md:flex flex-1 flex-col md:max-w-[calc(100%-18rem)] ${isMobile && selectedChat ? 'fixed inset-0 z-50' : 'border-l border-gray-200'}`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className={`flex items-center p-4 border-b border-gray-200 bg-white ${!isMobile && 'rounded-tr-lg'}`}>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 p-0 h-8 w-8"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={mockChats.find(c => c.id === selectedChat)?.user.avatar} />
                    <AvatarFallback>
                      {mockChats.find(c => c.id === selectedChat)?.user.firstName[0]}
                      {mockChats.find(c => c.id === selectedChat)?.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="font-medium">
                      {mockChats.find(c => c.id === selectedChat)?.user.firstName}
                      {' '}
                      {mockChats.find(c => c.id === selectedChat)?.user.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {mockMessages[selectedChat]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 ${msg.sender === 'me'
                          ? 'bg-social text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                          }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className={`border-t border-gray-200 p-3 flex gap-2 bg-white ${!isMobile && 'rounded-br-lg'}`}>
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
                <div className={`text-center p-4 max-w-md ${!isMobile && 'border border-gray-200 rounded-lg bg-white shadow-sm p-8'}`}>
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Your messages</h3>
                  <p className="text-gray-500">
                    Select a conversation from the list to start messaging or search for a specific person.
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
