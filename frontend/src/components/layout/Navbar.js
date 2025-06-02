'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  User,
  Home,
  Users,
  LogOut,
  Settings,
  Search,
  Menu,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if on authentication pages
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', badge: 3 },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: 5 }
  ];

  // Simplified version of navbar for auth pages
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-social font-bold text-2xl">
              social<span className="text-social-accent">network</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const displayName = currentUser?.nickname || `${currentUser?.firstName} ${currentUser?.lastName}`;
  const initials = currentUser?.firstName && currentUser?.lastName
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : '??';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and search */}
          <div className="flex items-center flex-1">
            <Link href="/" className="text-social font-bold text-2xl">social<span className="text-social-accent">network</span></Link>

            {currentUser && (
              <div className="hidden md:block ml-6 flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-10 h-9 md:w-full max-w-sm rounded-full bg-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Desktop navigation - only show when authenticated */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  className="px-3 py-2 rounded-md text-gray-500 hover:bg-social-light hover:text-social relative"
                >
                  <item.icon className="h-6 w-6" />
                  {item.badge && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* User menu - only for authenticated users */}
          {currentUser ? (
            <div className="flex items-center ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 hover:bg-transparent focus:bg-transparent">
                    <Avatar className="h-8 w-8 cursor-default">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center p-2">
                    <div className="ml-2 text-sm font-medium">
                      {displayName}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button - only show when authenticated */}
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile navigation menu - only show when authenticated */}
      {mobileMenuOpen && currentUser && (
        <nav className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 py-3 space-y-1">
            <div className="px-4 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 h-9 w-full rounded-full bg-gray-100"
                />
              </div>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md relative"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="mr-3 h-6 w-6 text-gray-500" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
