"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { formatAvatarUrl } from "@/lib/utils";
import { useGroup } from "@/context/GroupContext";

const RightSidebar = () => {
  const pathname = usePathname();
  const { groupData } = useGroup();
  const isGroupDetailPage =
    pathname.startsWith("/groups/") && pathname.split("/").length === 3;

  // Group sidebar content
  if (isGroupDetailPage && groupData) {
    const formatEventDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };

    return (
      <div className="hidden lg:block w-64 pl-2 flex-shrink-0 space-y-3">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Members (
              {groupData.members_count || groupData.members?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupData.members && groupData.members.length > 0 ? (
                groupData.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.firstname?.[0] || member.first_name?.[0] || "U"}
                        {member.lastname?.[0] || member.last_name?.[0] || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.firstname || member.first_name || "Unknown"}{" "}
                        {member.lastname || member.last_name || "User"}
                      </p>
                      {member.nickname && (
                        <p className="text-xs text-gray-500 truncate">
                          {member.nickname}
                        </p>
                      )}
                      {member.role && member.role !== "member" && (
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No members yet.</p>
              )}
            </div>
            {groupData.members && groupData.members.length > 5 && (
              <Button variant="ghost" className="w-full mt-4 text-sm">
                See all members
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupData.Events && groupData.Events.length > 0 ? (
              <div className="space-y-4">
                {groupData.Events.slice(0, 2).map((event) => (
                  <div key={event.id} className="border-b pb-3 last:border-0">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-500 mb-1">
                      {formatEventDate(event.event_time)}
                    </p>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500 mr-2">
                        {event.attendees ? event.attendees.length : 0} going
                      </p>
                      {event.user_rsvp_status === "going" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50"
                        >
                          You're going
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => (window.location.href = `/events`)}
                >
                  See all events
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No upcoming events scheduled
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default sidebar content for other pages
  const currentUser = {
    id: "1",
    firstName: "Demo",
    lastName: "User",
  };

  const getAllUsers = () => [
    { id: "2", firstName: "Jane", lastName: "Doe", avatar: "" },
    { id: "3", firstName: "John", lastName: "Smith", avatar: "" },
  ];

  if (!currentUser) return null;

  const otherUsers = getAllUsers().filter((user) => user.id !== currentUser.id);
  const onlineUsers = otherUsers.slice(0, 3);
  const friendSuggestions = otherUsers.slice(3, 6);

  const upcomingEvents = [
    {
      id: "1",
      title: "Tech Conference 2023",
      date: "2023-10-15T09:00:00Z",
      attendees: 156,
    },
    {
      id: "2",
      title: "Design Workshop",
      date: "2023-10-20T14:00:00Z",
      attendees: 42,
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="hidden lg:block w-64 pl-2 flex-shrink-0 space-y-3">
      {/* Online Friends */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <h3 className="font-medium mb-3">Online Followers</h3>
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Avatar>
                    <AvatarImage
                      src={formatAvatarUrl(user.avatar)}
                      alt={user.firstName}
                    />
                    <AvatarFallback>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
              >
                <span className="sr-only">Message</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                </svg>
              </Button>
            </div>
          ))}

          {onlineUsers.length === 0 && (
            <p className="text-sm text-gray-500">
              No friends online right now.
            </p>
          )}
        </div>
      </div>

      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <h3 className="font-medium mb-3">People You May Know</h3>
        <div className="space-y-3">
          {friendSuggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage
                    src={formatAvatarUrl(user.avatar)}
                    alt={user.firstName}
                  />
                  <AvatarFallback>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">5 mutual friends</div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Add
              </Button>
            </div>
          ))}

          {friendSuggestions.length === 0 && (
            <p className="text-sm text-gray-500">No suggestions available.</p>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <h3 className="font-medium mb-3">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="border border-gray-100 rounded-lg p-2"
            >
              <h4 className="font-medium text-sm">{event.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(event.date)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  {event.attendees} going
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-social"
                >
                  Interested
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
