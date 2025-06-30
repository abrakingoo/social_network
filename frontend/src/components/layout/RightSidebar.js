"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { formatAvatarUrl } from "@/lib/utils";
import { useGroup } from "@/context/GroupContext";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

const RightSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { groupData } = useGroup();
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const isGroupDetailPage =
    pathname.startsWith("/groups/") && pathname.split("/").length === 3;
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser) return;
      setLoadingSuggestions(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.message && data.message.non_mutual) {
            setSuggestions(data.message.non_mutual);
          }
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

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
  if (!currentUser) return null;

  const handleUserClick = (userId) => {
    router.push(`/followers?tab=suggestions&highlight=${userId}`);
  };

  return (
    <div className="hidden lg:block w-64 pl-2 flex-shrink-0 space-y-3">
      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <h3 className="font-medium mb-3">People You May Know</h3>
        <div className="space-y-3">
          {loadingSuggestions ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                onClick={() => handleUserClick(user.id)}
              >
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage
                      src={formatAvatarUrl(user.avatar)}
                      alt={user.firstname}
                    />
                    <AvatarFallback>
                      {user.firstname?.[0]}
                      {user.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {user.firstname} {user.lastname}
                    </div>
                    <div className="text-xs text-gray-500">
                      Suggested for you
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No new suggestions.</p>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No upcoming events.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RightSidebar;
