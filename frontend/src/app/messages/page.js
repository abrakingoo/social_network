
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const Messages = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

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
  if (!currentUser) {
    return <Navigate to="/login" replace />;
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

  return (
    <div className="min-h-screen bg-social-gray">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex">
          <LeftSidebar />

          <div className="flex-1 flex">
            {/* Chat List */}
            <div className="w-full md:w-1/3 md:pr-4">
              <Card className="h-[calc(100vh-160px)] flex flex-col overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {mockChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-gray-100' : ''}`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.user.avatar} />
                        <AvatarFallback>{chat.user.firstName[0]}{chat.user.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{chat.user.firstName} {chat.user.lastName}</h3>
                          <span className="text-xs text-gray-500">{formatDate(chat.timestamp)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-sm ${chat.unread ? 'font-medium text-gray-800' : 'text-gray-500'} truncate max-w-[200px]`}>
                            {chat.lastMessage}
                          </p>
                          {chat.unread && (
                            <span className="w-2 h-2 bg-social rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Chat Window */}
            <div className="hidden md:flex md:w-2/3 flex-col">
              {selectedChat ? (
                <Card className="h-[calc(100vh-160px)] flex flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center p-4 border-b">
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {mockMessages[selectedChat]?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender === 'me'
                              ? 'bg-social text-white'
                              : 'bg-gray-100 text-gray-800'
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
                  <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-social hover:bg-social-dark">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                </Card>
              ) : (
                <Card className="h-[calc(100vh-160px)] flex items-center justify-center">
                  <div className="text-center p-4">
                    <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a chat from the left to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
