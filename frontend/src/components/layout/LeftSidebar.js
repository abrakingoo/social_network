"use client";

import React from "react";
import Link from "next/link";
import { User, Users, BookOpen, Calendar, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { formatAvatarUrl } from "@/lib/utils";

const LeftSidebar = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const sidebarItems = [
    {
      icon: Users,
      label: "Followers",
      path: "/followers",
    },
    {
      icon: BookOpen,
      label: "Groups",
      path: "/groups",
    },
    {
      icon: Calendar,
      label: "Events",
      path: "/events",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
    },
  ];

  const displayName =
    currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`;
  const initials =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : "??";

  return (
    <div className="hidden md:block w-56 pr-2 flex-shrink-0 sticky top-16 h-fit pt-4">
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <Link
          href="/profile"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-social-light transition-colors"
        >
          <Avatar>
            <AvatarImage
              src={formatAvatarUrl(currentUser.avatar)}
              alt={displayName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
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
    </div>
  );
};

export default LeftSidebar;
