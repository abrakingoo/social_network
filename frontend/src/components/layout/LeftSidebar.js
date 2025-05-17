'use client';

import React from 'react';
import Link from 'next/link';
import { User, Users, BookOpen, Calendar, Image, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Auth context dependency removed

const LeftSidebar = () => {
  // Static data instead of context
  const currentUser = {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    avatar: ''  
  };

  if (!currentUser) return null;

  const sidebarItems = [
    {
      icon: User,
      label: 'My Profile',
      path: '/profile'
    },
    {
      icon: Users,
      label: 'Friends',
      path: '/friends'
    },
    {
      icon: BookOpen,
      label: 'Groups',
      path: '/groups'
    },
    {
      icon: Calendar,
      label: 'Events',
      path: '/events'
    },
    {
      icon: Image,
      label: 'Photos',
      path: '/photos'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings'
    }
  ];

  const displayName = currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`;

  return (
    <div className="hidden md:block w-56 pr-2 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
        <Link href="/profile" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light transition-colors">
          <Avatar>
            <AvatarImage src={currentUser.avatar} alt={displayName} />
            <AvatarFallback>{currentUser.firstName[0]}{currentUser.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="font-medium truncate">{displayName}</div>
        </Link>

        <nav className="space-y-1 mt-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light text-gray-700 hover:text-social transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Your shortcuts</h3>
        <nav className="space-y-1">
          <Link
            href="/groups/dev"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light transition-colors"
          >
            <div className="h-7 w-7 rounded-md bg-social-dark text-white flex items-center justify-center">
              D
            </div>
            <span>Developer Community</span>
          </Link>
          <Link
            href="/groups/tech"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light transition-colors"
          >
            <div className="h-7 w-7 rounded-md bg-purple-600 text-white flex items-center justify-center">
              T
            </div>
            <span>Tech Enthusiasts</span>
          </Link>
          <Link
            href="/groups/design"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light transition-colors"
          >
            <div className="h-7 w-7 rounded-md bg-pink-600 text-white flex items-center justify-center">
              D
            </div>
            <span>Design Inspiration</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default LeftSidebar;
