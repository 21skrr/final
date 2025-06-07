import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuth();

  // Mock events data
  const events = [
    {
      id: 1,
      title: 'Team Onboarding Session',
      date: '2024-03-15',
      time: '10:00 AM - 11:30 AM',
      location: 'Conference Room A',
      attendees: 5,
      type: 'onboarding',
    },
    {
      id: 2,
      title: 'HR Training Workshop',
      date: '2024-03-15',
      time: '2:00 PM - 4:00 PM',
      location: 'Training Room 2',
      attendees: 12,
      type: 'training',
    },
    {
      id: 3,
      title: 'New Hire Orientation',
      date: '2024-03-20',
      time: '9:00 AM - 12:00 PM',
      location: 'Main Hall',
      attendees: 8,
      type: 'orientation',
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'onboarding':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'orientation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth(currentMonth);

  const canAddEvents = user?.role === 'hr' || user?.role === 'manager';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view all scheduled events and activities
            </p>
          </div>
          {canAddEvents && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Add Event
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mx-4">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                  Today
                </button>
                <select className="rounded-md border-gray-300 text-sm">
                  <option>Month</option>
                  <option>Week</option>
                  <option>Day</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 ${
                    day ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900">{day}</div>
                      <div className="mt-2 space-y-1">
                        {events
                          .filter(event => new Date(event.date).getDate() === day)
                          .map(event => (
                            <div
                              key={event.id}
                              className={`px-2 py-1 rounded-md text-xs font-medium ${getEventTypeColor(
                                event.type
                              )}`}
                            >
                              {event.title}
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {events.map(event => (
              <div key={event.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{event.title}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        {event.attendees} attendees
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;