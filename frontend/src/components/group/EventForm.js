'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const EventForm = ({ onClose, onEventCreated }) => {
  const { groupId } = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: null,
    time: '',
    location: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prevData => ({
      ...prevData,
      date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Form validation
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Error",
        description: "Event date is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // In a real app, this would call an API to create the event
    setTimeout(() => {
      const newEvent = {
        id: `event-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        groupId: groupId,
        attendees: 1, // Creator is first attendee
        createdAt: new Date()
      };

      toast({
        title: "Event created",
        description: "Your event has been created successfully",
      });

      if (onEventCreated) {
        onEventCreated(newEvent);
      }

      setIsSubmitting(false);
      if (onClose) {
        onClose();
      }
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title*</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Event title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="What is this event about?"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Date*</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.date ? (
                  format(formData.date, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.date}
                onSelect={handleDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="time">Time</Label>
          <div className="relative">
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleInputChange}
              className="pl-10"
            />
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="Where will this event take place?"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="bg-social hover:bg-social-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
