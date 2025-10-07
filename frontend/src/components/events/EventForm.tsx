import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event, eventsService } from '../../services/events';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    type: 'meeting',
  });

  useEffect(() => {
    if (event) {
      // When editing, convert ISO strings back to 'YYYY-MM-DDTHH:mm' for datetime-local input
      setFormData({
        ...event,
        startDate: event.startDate ? new Date(event.startDate).toISOString().substring(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().substring(0, 16) : '',
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Omit<Event, 'id'> = {
        title: formData.title || '',
        description: formData.description || '',
        location: formData.location || '',
        type: formData.type || 'meeting',
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : '',
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        createdBy: user?.id || '',
      };

      if (event?.id) {
        await eventsService.updateEvent(event.id, payload);
        toast.success('Event updated successfully');
      } else {
        await eventsService.createEvent(payload);
        toast.success('Event created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(event?.id ? 'Failed to update event' : 'Failed to create event');
      console.error('Error saving event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event?.id ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="startDate"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date & Time (optional)
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="meeting">Meeting</option>
              <option value="training">Training</option>
              <option value="event">Event</option>
              <option value="planning">Planning</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {event?.id ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm; 