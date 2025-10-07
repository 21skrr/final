import React from 'react';
import { X, Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { Event } from '../../services/events';

interface EventSummaryProps {
  event: Event;
  onClose: () => void;
}

const EventSummary: React.FC<EventSummaryProps> = ({ event, onClose }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Title and Type */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.type)}`}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">{formatDate(event.startDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">
                    {formatTime(event.startDate)}
                    {event.endDate && ` - ${formatTime(event.endDate)}`}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="space-y-4">
              {event.creator && (
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created by</p>
                    <p className="text-gray-900">{event.creator.name}</p>
                    <p className="text-sm text-gray-500">{event.creator.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t pt-6">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSummary;
