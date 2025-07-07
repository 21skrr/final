import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { Users, Calendar, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import teamService from '../../services/teamService';
import * as evaluationService from '../../services/evaluationService';
import eventService from '../../services/eventService';
import analyticsService from '../../services/analyticsService';

interface SupervisorDashboardProps {
  user: User;
}

type TeamMember = {
  id: string;
  name: string;
  role?: string;
  program?: string;
  stage?: string;
  progress?: number;
  daysInProgram?: number;
  avatar?: string;
};

type Evaluation = {
  id: string;
  employeeName?: string;
  employeeId?: string;
  type?: string;
  dueDate?: string;
};

type Event = {
  id: string;
  title: string;
  startDate?: string;
  date?: string;
};

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch team members
        const team = await teamService.getMyTeam();
        console.log('Team data:', team);
        // Fetch onboarding progress for each member
        const teamWithProgress: TeamMember[] = await Promise.all(
          team.map(async (member: TeamMember) => {
            let progress = 0;
            // TODO: Update analyticsService.getPersonalOnboarding to accept a userId for supervisor view
            // For now, fallback to 0 or member.progress
            // const progressData = await analyticsService.getPersonalOnboarding(member.id);
            // progress = progressData?.progress ?? 0;
            progress = member.progress ?? 0;
            return {
              ...member,
              progress,
            };
          })
        );
        setTeamMembers(teamWithProgress);

        // Fetch pending evaluations
        const evalsRes = await evaluationService.getSupervisorEvaluations();
        // Use unknown[] and a type guard
        const evalsArr: unknown[] = Array.isArray(evalsRes) ? evalsRes : (evalsRes.data || []);
        function isEvaluationWithStatus(e: unknown): e is Evaluation & { status?: string; employee?: { name?: string; id?: string }, evaluationType?: string } {
          return typeof e === 'object' && e !== null && 'status' in e;
        }
        const pending: Evaluation[] = evalsArr
          .filter(isEvaluationWithStatus)
          .filter((e) => e.status === 'pending' || e.status === 'in_progress')
          .map((e) => ({
            id: e.id,
            employeeName: e.employeeName || (e.employee && e.employee.name),
            employeeId: e.employeeId || (e.employee && e.employee.id),
            type: e.type || e.evaluationType,
            dueDate: e.dueDate,
          }));
        setPendingEvaluations(pending);

        // Fetch events (filter for team events, future dates, limit 3)
        const events: Event[] = await eventService.getEvents();
        const now = new Date();
        const upcoming: Event[] = events
          .filter((e) => new Date(e.startDate ?? e.date ?? '') > now)
          .sort((a, b) => new Date(a.startDate ?? a.date ?? '').getTime() - new Date(b.startDate ?? b.date ?? '').getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', options);
  };
  
  // Helper to safely normalize stage
  const normalizeStage = (stage: string | undefined) => {
    if (typeof stage !== 'string') return '';
    return stage.replace(/ /g, '').toLowerCase();
  };
  
  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">
          You're supervising {teamMembers.length} employees across different early career programs.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Overview</h2>
          </div>
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{teamMembers.length}</span>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-yellow-500">{
                  Array.isArray(teamMembers)
                    ? teamMembers.filter(m => typeof m.stage === 'string' && (normalizeStage(m.stage) === 'orient' || normalizeStage(m.stage) === 'land')).length
                    : 0
                }</span>
                <span className="text-sm text-gray-500">New</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-green-500">{
                  Array.isArray(teamMembers)
                    ? teamMembers.filter(m => typeof m.stage === 'string' && normalizeStage(m.stage) === 'excel').length
                    : 0
                }</span>
                <span className="text-sm text-gray-500">Completing</span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/team"
                className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Team
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-orange-500 text-white p-4 flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Pending Evaluations</h2>
          </div>
          <div className="p-4">
            {pendingEvaluations.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No pending evaluations</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingEvaluations.map((evaluation) => (
                  <li key={evaluation.id} className="py-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{evaluation.employeeName}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                        {evaluation.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Due: {formatDate(evaluation.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link
                to="/evaluations"
                className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Complete Evaluations
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-600 text-white p-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Upcoming Events</h2>
          </div>
          <div className="p-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No upcoming events</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="py-3">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
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
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-800 text-white flex items-center">
          <Users className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={member.avatar} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${member.progress ?? 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{member.progress ?? 0}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;