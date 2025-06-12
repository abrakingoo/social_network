'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
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
import { groupService } from '@/services/groupService';

const EventForm = ({ onClose, onEventCreated, groupTitle }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation - all fields are required according to API
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Event description is required",
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

    if (!formData.location.trim()) {
      toast({
        title: "Error",
        description: "Event location is required",
        variant: "destructive"
      });
      return;
    }

    if (!groupTitle) {
      toast({
        title: "Error",
        description: "Group information is missing",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into a single ISO 8601 string
      let eventTime = null;
      if (formData.date) {
        const datePart = format(formData.date, "yyyy-MM-dd");
        if (formData.time) {
          eventTime = `${datePart}T${formData.time}:00Z`; // Time in HH:MM format, append :00Z for UTC
        } else {
          eventTime = `${datePart}T00:00:00Z`; // Default to start of day if no time
        }
      }

      // Match API requirements exactly
      const newEventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_time: eventTime,
        group_title: groupTitle, // API expects group_title, not group_id
        location: formData.location.trim()
      };

      console.log('[EventForm] Creating event with data:', newEventData);

      const result = await groupService.createEvent(newEventData);

      console.log('[EventForm] Event creation result:', result);

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: null,
        time: '',
        location: ''
      });

      // Just call the callback to trigger refresh - no need for mock data
      if (onEventCreated) {
        onEventCreated(); // Parent component will handle the refresh
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('[EventForm] Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title*</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter event title"
          required
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="description">Description*</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="What is this event about?"
          rows={4}
          required
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Event Date*</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
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
                disabled={(date) => date < new Date().setHours(0, 0, 0, 0)} // Disable past dates
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="time">Event Time (Optional)</Label>
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
        <Label htmlFor="location">Location*</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="Where will this event take place?"
          required
          maxLength={200}
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