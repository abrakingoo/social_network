'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Search } from 'lucide-react';

const Messages = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

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
  const filteredChats = mockChats.filter(chat =>
    (chat.user.firstName + ' ' + chat.user.lastName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)]">
      <Card className="h-full flex border border-gray-200 overflow-hidden">
        {/* Chat List */}
        <div className="w-72 border-r border-gray-200 flex flex-col">
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
                    <AvatarImage src={chat.user.avatar} />
                    <AvatarFallback>{chat.user.firstName[0]}{chat.user.lastName[0]}</AvatarFallback>
                  </Avatar>
                  {chat.unread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-social rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate">{chat.user.firstName} {chat.user.lastName}</h3>
                    <span className="text-xs text-gray-500 ml-1 shrink-0">{formatDate(chat.timestamp)}</span>
                  </div>
                  <p className={`text-sm truncate ${chat.unread ? 'text-gray-800' : 'text-gray-500'}`}>
                    {chat.lastMessage}
                  </p>
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
        <div className="flex-1 flex flex-col max-w-[calc(100%-18rem)]">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center p-4 border-b border-gray-200 bg-white">
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
                      className={`max-w-[70%] rounded-2xl p-3 ${
                        msg.sender === 'me'
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
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 flex gap-2 bg-white">
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
              <div className="text-center p-4 max-w-md">
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
      </Card>
    </div>
  );
};

export default Messages;
