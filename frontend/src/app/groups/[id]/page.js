'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PostForm from '@/components/post/PostForm';
import PostCard from '@/components/post/PostCard';
import EventForm from '@/components/group/EventForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, Settings, Info, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

const GroupDetail = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id;
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState({});

  // Mock group data (keep this from the original file)
  const [mockGroup, setMockGroup] = useState({
    id: groupId,
    name: 'Photography Enthusiasts',
    description: 'A group for sharing photography tips, gear recommendations, and amazing photos!',
    coverImage: null,
    memberCount: 452,
    isJoined: true,
    isAdmin: groupId === '2', // For demo: user is admin of group with ID 2
    createdAt: new Date(2022, 5, 15),
    members: [
      { id: '101', firstName: 'John', lastName: 'Doe', avatar: null },
      { id: '102', firstName: 'Jane', lastName: 'Smith', avatar: null },
      { id: '103', firstName: 'Mike', lastName: 'Johnson', avatar: null }
    ],
    events: [
      {
        id: '201',
        title: 'Monthly Photography Contest',
        description: 'Submit your best nature photos for a chance to win!',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
        time: '14:00',
        location: 'Online',
        attendees: 28
      },
      {
        id: '202',
        title: 'Photography Workshop',
        description: 'Learn how to capture stunning landscape photos',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12), // 12 days from now
        time: '10:00',
        location: 'Central Park',
        attendees: 15
      }
    ]
  });

  // Mock posts
  const mockPosts = [
    {
      id: '301',
      author: { id: '101', firstName: 'John', lastName: 'Doe', avatar: null },
      content: 'Just got this amazing shot during sunset! What do you think?',
      image: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      likesCount: 24,
      commentsCount: 5,
      isLiked: false,
      groupId: groupId
    },
    {
      id: '302',
      author: { id: '102', firstName: 'Jane', lastName: 'Smith', avatar: null },
      content: 'Does anyone have recommendations for a good entry-level DSLR camera?',
      image: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      likesCount: 8,
      commentsCount: 12,
      isLiked: true,
      groupId: groupId
    }
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Don't render if user not authenticated
  if (!currentUser) {
    return null;
  }

  const formatEventDate = (date, time) => {
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    return time ? `${formattedDate}, ${time}` : formattedDate;
  };

  const handleJoinGroup = () => {
    toast({
      title: "Group joined",
      description: "You have successfully joined the group!",
    });
  };

  const handleRSVP = (eventId) => {
    // Toggle RSVP status
    setRsvpStatus(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));

    toast({
      title: rsvpStatus[eventId] ? "RSVP Cancelled" : "RSVP Confirmed",
      description: rsvpStatus[eventId]
        ? "You're no longer attending this event."
        : "You're going to this event!",
    });
  };

  const handleEventCreated = (newEvent) => {
    setMockGroup(prevGroup => ({
      ...prevGroup,
      events: [newEvent, ...prevGroup.events]
    }));
    setIsCreateEventOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Group Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-social/30 to-social-accent/30 relative">
          {mockGroup.isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit Cover
            </Button>
          )}
        </div>
        <CardHeader className="relative pt-0">
          <div className="absolute -top-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarFallback className="text-3xl bg-social text-white">
                {mockGroup.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-28 flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{mockGroup.name}</CardTitle>
              <CardDescription>
                {mockGroup.memberCount} members · Created {mockGroup.createdAt.toLocaleDateString()}
              </CardDescription>
            </div>

            {mockGroup.isAdmin ? (
              <Button className="bg-social hover:bg-social-dark">
                <Settings className="h-4 w-4 mr-2" />
                Manage Group
              </Button>
            ) : mockGroup.isJoined ? (
              <Button variant="outline">Leave Group</Button>
            ) : (
              <Button
                className="bg-social hover:bg-social-dark"
                onClick={handleJoinGroup}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Join Group
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{mockGroup.description}</p>
        </CardContent>
      </Card>

      {/* Group Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="posts" className="w-full mb-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {/* Posts content - keep existing code */}
              {mockGroup.isJoined && (
                <div className="mb-6">
                  <PostForm groupId={groupId} />
                </div>
              )}

              {mockPosts.length > 0 ? (
                <div className="space-y-6">
                  {mockPosts.map((post) => (
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
              {mockGroup.isAdmin && (
                <div className="mb-6">
                  <Button
                    className="w-full bg-social hover:bg-social-dark"
                    onClick={() => setIsCreateEventOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {mockGroup.events.length > 0 ? (
                  mockGroup.events.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{event.title}</CardTitle>
                            <CardDescription>
                              {formatEventDate(event.date, event.time)}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => handleRSVP(event.id)}
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
                            {event.attendees + (rsvpStatus[event.id] ? 1 : 0)}
                            {(event.attendees + (rsvpStatus[event.id] ? 1 : 0)) === 1 ? ' person' : ' people'} going
                          </Badge>

                          {rsvpStatus[event.id] && (
                            <Badge variant="outline" className="bg-green-50">
                              You're going
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                    <p className="text-gray-500">
                      There are no scheduled events for this group yet
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              {/* About content - keep existing code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    About this group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {mockGroup.description}
                  </p>
                  <div>
                    <h4 className="font-medium mb-2">Created on</h4>
                    <p className="text-gray-600 mb-4">
                      {mockGroup.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
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

        {/* Sidebar */}
        <div>
          {/* Members - keep existing code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockGroup.members.map((member) => (
                  <div key={member.id} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-sm">
                See all members
              </Button>
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
              {mockGroup.events.length > 0 ? (
                <div className="space-y-4">
                  {mockGroup.events.slice(0, 2).map((event) => (
                    <div key={event.id} className="border-b pb-3 last:border-0">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-500 mb-1">
                        {formatEventDate(event.date, event.time)}
                      </p>
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 mr-2">
                          {event.attendees + (rsvpStatus[event.id] ? 1 : 0)} going
                        </p>
                        {rsvpStatus[event.id] && (
                          <Badge variant="outline" className="text-xs bg-green-50">
                            You're going
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-sm">
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
      </div>

      {/* Event Creation Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create an Event</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new event for this group
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onClose={() => setIsCreateEventOpen(false)}
            onEventCreated={handleEventCreated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetail;
