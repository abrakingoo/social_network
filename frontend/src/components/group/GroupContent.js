'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Info, Loader2 } from 'lucide-react';
import PostForm from '@/components/post/PostForm';
import PostCard from '@/components/post/PostCard';

const GroupContent = ({
  groupData,
  rsvpStatus,
  isRefreshingEvents,
  onCreateEvent,
  onRSVP
}) => {
  const formatEventDate = (dateString, time) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    return time ? `${formattedDate}, ${time}` : formattedDate;
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="posts" className="w-full mb-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {groupData.is_joined && (
            <div className="mb-6">
              <PostForm groupId={groupData.group_id} />
            </div>
          )}

          {groupData.group_post && groupData.group_post.length > 0 ? (
            <div className="space-y-6">
              {groupData.group_post.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-gray-500">
                Be the first to post in this group!
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          {groupData.is_joined && (
            <div className="mb-6">
              <Button
                className="w-full bg-social hover:bg-social-dark"
                onClick={onCreateEvent}
                disabled={isRefreshingEvents}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isRefreshingEvents ? "Updating..." : "Create Event"}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {isRefreshingEvents && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-social mr-2" />
                <span className="text-sm text-gray-600">Updating events...</span>
              </div>
            )}

            {groupData.Events && groupData.Events.length > 0 ? (
              groupData.Events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          {formatEventDate(event.event_time, '')}
                          {event.location && ` · ${event.location}`}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => onRSVP(event.id)}
                        className={rsvpStatus[event.id] ? "bg-green-600 hover:bg-green-700" : "bg-social hover:bg-social-dark"}
                      >
                        {rsvpStatus[event.id] ? "Going" : "RSVP"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{event.description}</p>

                    {event.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span className="font-medium mr-2">Location:</span>
                        {event.location}
                      </div>
                    )}

                    <div className="mt-3 flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        {event.attendees ? event.attendees.length : 0}
                        {(event.attendees ? event.attendees.length : 0) === 1 ? ' person' : ' people'} going
                      </Badge>

                      {rsvpStatus[event.id] && (
                        <Badge variant="outline" className="bg-green-50">
                          You're going
                        </Badge>
                      )}
                    </div>
                    {event.creator && event.creator.firstname && (
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span>Created by {event.creator.firstname} {event.creator.lastname}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                <p className="text-gray-500">
                  {groupData.is_joined ? 'Create the first event for this group!' : 'There are no scheduled events for this group yet'}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                About this group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {groupData.about || 'No description available.'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">{groupData.created_at ? new Date(groupData.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium">Members:</span>
                  <p className="text-gray-600">{groupData.members_count || groupData.members?.length || 0}</p>
                </div>
                {groupData.Creator && groupData.Creator.firstname && (
                  <div>
                    <span className="font-medium">Creator:</span>
                    <p className="text-gray-600">
                      {groupData.Creator.firstname} {groupData.Creator.lastname}
                      {groupData.Creator.nickname && ` (${groupData.Creator.nickname})`}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Group rules</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Be kind and respectful to other members</li>
                  <li>No spam or self-promotion</li>
                  <li>Only share content relevant to the group's purpose</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupContent;
