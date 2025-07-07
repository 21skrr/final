import React from 'react';
import { User } from '../../types/user';
import { Users, ClipboardCheck, Calendar, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import { useEffect, useState } from 'react';
import eventService from '../../services/eventService';

interface ManagerDashboardProps {
  user: User;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const [dashboard, setDashboard] = useState<unknown>(null);
  const [onboardingKPI, setOnboardingKPI] = useState<unknown>(null);
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dash = await analyticsService.getDepartmentDashboard();
        const kpi = await analyticsService.getDepartmentOnboardingKPI();
        setDashboard(dash);
        setOnboardingKPI(kpi);
        // Fetch events
        const allEvents = await eventService.getEvents();
        setEvents(Array.isArray(allEvents) ? allEvents.slice(0, 3) : []);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString || '').toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString: string | undefined) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString || '').toLocaleTimeString('en-US', options);
  };
  
  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Example mapping: you may need to adjust these based on your actual API response
  const totalEmployees = (dashboard as any)?.totalUsers ?? 0;
  // You may need to aggregate inOnboarding and completedOnboarding from onboardingKPI or another endpoint
  // For now, just show totalEmployees and teams
  const teams = (dashboard as any)?.teams ?? [];
  const roleBreakdown = (dashboard as any)?.roleBreakdown ?? {};

  // Example: aggregate onboarding by stage from onboardingKPI
  let inOnboarding = 0;
  let completedOnboarding = 0;
  if (Array.isArray(onboardingKPI)) {
    (onboardingKPI as { byStage?: { stage: string; count: number }[] }[]).forEach((team: { byStage?: { stage: string; count: number }[] }) => {
      if (Array.isArray(team.byStage)) {
        team.byStage.forEach((stage: { stage: string; count: number }) => {
          if (stage.stage === 'excel') {
            completedOnboarding += Number(stage.count) || 0;
          } else {
            inOnboarding += Number(stage.count) || 0;
          }
        });
      }
    });
  }

  // Fix roleBreakdown reduce
  const roleBreakdownCount = Object.values(roleBreakdown as Record<string, number>).reduce((a, b) => (a as number) + (b as number), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">
          {/* You may want to show more real stats here */}
          Department: {(dashboard as any)?.department} | Teams: {teams.length} | Total Employees: {totalEmployees}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-blue-100 p-3 mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalEmployees}</span>
          <span className="text-sm text-gray-500">Total Team Members</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-yellow-100 p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900">{inOnboarding}</span>
          <span className="text-sm text-gray-500">In Onboarding</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-green-100 p-3 mb-3">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{completedOnboarding}</span>
          <span className="text-sm text-gray-500">Completed Onboarding</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-purple-100 p-3 mb-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{roleBreakdownCount}</span>
          <span className="text-sm text-gray-500">Role Breakdown</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-600 p-4 text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Upcoming Events</h2>
            </div>
            <div className="p-4">
              {events.length === 0 ? (
                <p className="text-center text-gray-500 py-2">No upcoming events</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {(events as { id: string; title: string; startDate?: string; date?: string; type?: string }[]).map((event) => (
                    <li key={event.id} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeClass(event.type || '')}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(event.startDate || event.date)} at {formatTime(event.startDate || event.date)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link
                  to="/calendar"
                  className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  View Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;