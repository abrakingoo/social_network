'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Clock, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import EventForm from '@/components/group/EventForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Events() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Photography Workshop',
      description: 'Learn the basics of photography with professional photographers. Bring your own camera!',
      date: new Date(2025, 5, 15),
      time: '14:00',
      location: 'Central Park, NY',
      attendees: 24,
      createdAt: new Date(2025, 4, 1),
      groupId: '1',
      isAttending: true
    },
    {
      id: '2',
      title: 'Book Club Meeting: "The Midnight Library"',
      description: 'Join us for our monthly book club discussion. This month, we\'re reading "The Midnight Library" by Matt Haig.',
      date: new Date(2025, 5, 20),
      time: '18:30',
      location: 'City Library, Meeting Room 2',
      attendees: 12,
      createdAt: new Date(2025, 4, 5),
      groupId: '2',
      isAttending: false
    },
    {
      id: '3',
      title: 'Tech Meetup: AI Ethics',
      description: 'A discussion about the ethical implications of AI in today\'s world with industry experts.',
      date: new Date(2025, 5, 25),
      time: '19:00',
      location: 'TechHub Coworking Space',
      attendees: 45,
      createdAt: new Date(2025, 4, 10),
      groupId: '3',
      isAttending: false
    }
  ]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Stop rendering if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    setIsFormOpen(false);
  };

  const toggleAttendance = (eventId) => {
    setEvents(prevEvents => prevEvents.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          attendees: event.isAttending ? event.attendees - 1 : event.attendees + 1,
          isAttending: !event.isAttending
        };
      }
      return event;
    }));
  };

  // Filter events based on search query
  const filteredEvents = searchQuery
    ? events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  return (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Upcoming Events</h1>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-social hover:bg-social-dark">
                      Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create a New Event</DialogTitle>
                    </DialogHeader>
                    <EventForm onClose={() => setIsFormOpen(false)} onEventCreated={handleEventCreated} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events"
                  className="pl-10"
                />
              </div>

              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            <p className="text-sm text-gray-500">
                              {format(event.date, 'EEEE, MMMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant={event.isAttending ? "default" : "outline"}>
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
                            <span>{format(event.date, 'MMMM d, yyyy')}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{event.attendees} {event.attendees === 1 ? 'person' : 'people'} attending</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button
                          variant={event.isAttending ? "outline" : "default"}
                          onClick={() => toggleAttendance(event.id)}
                          className="w-full"
                        >
                          {event.isAttending ? "Cancel Attendance" : "Attend Event"}
                        </Button>
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
                </div>
              )}
    </div>
  );
}
