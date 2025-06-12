'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/services/groupService';
import { titleToSlug } from '@/lib/slugUtils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Clock, Search, Users, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function Events() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState({});

  // Fetch all events from all groups
  const fetchAllEvents = async () => {
    if (!currentUser || authLoading) {
      console.log('[Events] Skipping fetch - auth not ready:', { currentUser, authLoading });
      return;
    }

    try {
      console.log('[Events] Fetching all groups to get events...');
      setLoading(true);

      // Get all groups first
      const allGroupsResult = await groupService.getAllGroups();
      const allGroups = allGroupsResult.groups || [];

      console.log('[Events] Found groups:', allGroups.length);

      // Collect all events from all groups
      const allEvents = [];

      for (const group of allGroups) {
        try {
          // Get detailed group data to access events
          const groupDetails = await groupService.getGroupDetails(group.title);
          const groupEvents = groupDetails.Events || [];

          // Add group information to each event and flatten
          const eventsWithGroupInfo = groupEvents.map(event => ({
            ...event,
            group: {
              id: group.id,
              title: group.title,
              slug: titleToSlug(group.title)
            },
            // Check if current user is attending
            isAttending: (event.attendees || []).some(attendee => attendee.id === currentUser.id)
          }));

          allEvents.push(...eventsWithGroupInfo);
        } catch (error) {
          console.warn(`[Events] Failed to fetch events for group ${group.title}:`, error);
          // Continue with other groups even if one fails
        }
      }

      // Sort events by date (closest first)
      allEvents.sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

      console.log('[Events] Total events found:', allEvents.length);
      setEvents(allEvents);

    } catch (error) {
      console.error('[Events] Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllEvents();
  }, [currentUser, authLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Handle RSVP toggle
  const toggleAttendance = async (eventId) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to RSVP to events.",
        variant: "destructive"
      });
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const currentStatus = event.isAttending ? "going" : "not_going";
    const newStatus = currentStatus === "going" ? "not_going" : "going";
    const toastTitle = newStatus === "going" ? "RSVP Confirmed" : "RSVP Cancelled";
    const toastDescription = newStatus === "going" ? "You have successfully RSVP'd for this event!" : "You have un-RSVP'd for this event.";

    // Set loading state for this specific event
    setRsvpLoading(prev => ({ ...prev, [eventId]: true }));

    // Optimistic UI update
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id === eventId) {
        const updatedAttendees = newStatus === "going"
          ? [...(evt.attendees || []), currentUser]
          : (evt.attendees || []).filter(attendee => attendee.id !== currentUser.id);
        return {
          ...evt,
          attendees: updatedAttendees,
          isAttending: newStatus === "going"
        };
      }
      return evt;
    }));

    try {
      await groupService.rsvpEvent(eventId, newStatus);

      toast({
        title: toastTitle,
        description: toastDescription,
      });
    } catch (error) {
      console.error('Error updating RSVP status:', error);

      // Revert optimistic update on error
      setEvents(prevEvents => prevEvents.map(evt => {
        if (evt.id === eventId) {
          const revertedAttendees = currentStatus === "going"
            ? [...(evt.attendees || []), currentUser]
            : (evt.attendees || []).filter(attendee => attendee.id !== currentUser.id);
          return {
            ...evt,
            attendees: revertedAttendees,
            isAttending: currentStatus === "going"
          };
        }
        return evt;
      }));

      toast({
        title: "RSVP Failed",
        description: error.message || "Failed to update RSVP status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRsvpLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Stop rendering if user is not authenticated
  if (authLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  // Filter events based on search query
  const filteredEvents = searchQuery
    ? events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.group.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  // Helper function to format event date and time
  const formatEventDateTime = (eventTime) => {
    const date = new Date(eventTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upcoming Events</h1>
          <p className="text-gray-600 mt-1">Discover and join events from all your groups</p>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by title, description, location, or group..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-social" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <Link
                        href={`/groups/${event.group.slug}`}
                        className="text-social hover:text-social-dark"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatEventDateTime(event.event_time)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      From: <Link
                        href={`/groups/${event.group.slug}`}
                        className="text-social hover:text-social-dark font-medium"
                      >
                        {event.group.title}
                      </Link>
                    </p>
                  </div>
                  <Badge variant={event.isAttending ? "default" : "outline"} className={event.isAttending ? "bg-green-600" : ""}>
                    {event.isAttending ? "Going" : "Not Going"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {event.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{format(new Date(event.event_time), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{format(new Date(event.event_time), 'h:mm a')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {event.attendees ? event.attendees.length : 0} {event.attendees && event.attendees.length === 1 ? 'person' : 'people'} attending
                    </span>
                  </div>
                  {event.creator && event.creator.firstname && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Created by {event.creator.firstname} {event.creator.lastname}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex gap-2 w-full">
                  <Button
                    variant={event.isAttending ? "outline" : "default"}
                    onClick={() => toggleAttendance(event.id)}
                    disabled={rsvpLoading[event.id]}
                    className="flex-1"
                  >
                    {rsvpLoading[event.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      event.isAttending ? "Cancel Attendance" : "Attend Event"
                    )}
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href={`/groups/${event.group.slug}`}>
                      View Group
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery
              ? `No events matching "${searchQuery}"`
              : "There are no upcoming events at this time"
            }
          </p>
          {!searchQuery && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-3">
                Events are created within groups. Join some groups to see their events!
              </p>
              <Button asChild className="bg-social hover:bg-social-dark">
                <Link href="/groups">Browse Groups</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}