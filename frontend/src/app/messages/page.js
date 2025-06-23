'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL, useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, Search, ArrowLeft } from 'lucide-react';
import { webSocketOperations } from '@/utils/websocket';

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
  const [prevMessages, setPreviousMessages] = useState([]);
  const [uuid, setUuid] = useState("");


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


  const prevMsg = async (userid) => {
    const data = await webSocketOperations.loadPreviousMessages(userid);
    if (data.messages != null){
      setPreviousMessages(data.messages);
    }
    setUuid(userid);
  }

  const resetPrevMessages = () => {
    setPreviousMessages([]);
    setUuid("");
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

  if (users.following != null){
    usersToMessage = [...usersToMessage,...users.following]
  }



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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = parseDate(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return formatTime(d);
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    webSocketOperations.sendPrivateMessage(uuid, message);
    setPreviousMessages([]);
    const data = await webSocketOperations.loadPreviousMessages(uuid);
    setPreviousMessages(data.messages)
    setMessage('');
  };

  // Filter chats based on search query
  const filteredChats = usersToMessage.filter(user =>
    (user.firstname + ' ' + user.lastname)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-[calc(100vh-120px)] ${isMobile ? '-mx-4' : ''}`}>
      <div className={`h-full ${isMobile ? 'rounded-none shadow-none' : 'border border-gray-200 rounded-lg shadow-sm'}`}>
        <div className="h-full flex">
          {/* Chat List - Hidden on mobile when a chat is selected */}
          <div className={`${isMobile && prevMessages ? 'hidden' : 'block'} md:block w-full md:w-72 ${!isMobile && 'border-r border-gray-200'} flex-shrink-0 flex flex-col`}>
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
                  onClick={() => prevMsg(chat.id)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.firstname[0]}{chat.lastname[0]}</AvatarFallback>
                    </Avatar>
                    {/* {chat.unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-social rounded-full border-2 border-white"></span>
                    )} */}
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
            className={`${isMobile && !prevMessages ? 'hidden' : 'flex'} md:flex flex-1 flex-col md:max-w-[calc(100%-18rem)] ${isMobile && prevMessages ? 'fixed inset-0 z-50' : 'border-l border-gray-200'}`}
          >
            {uuid ? (
              <>
                {/* Chat Header */}
                <div className={`flex items-center p-4 border-b border-gray-200 bg-white ${!isMobile && 'rounded-tr-lg'}`}>
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
                  {prevMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id != uuid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 ${msg.sender_id != uuid
                          ? 'bg-social text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                          }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id !== uuid ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatTime(msg.created_at)}
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
