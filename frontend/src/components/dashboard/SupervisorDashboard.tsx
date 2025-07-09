import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { Users, Calendar, ClipboardCheck, AlertTriangle, Sun, Moon, PlusCircle, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import teamService from '../../services/teamService';
import * as evaluationService from '../../services/evaluationService';
import eventService from '../../services/eventService';
import analyticsService from '../../services/analyticsService';
import onboardingService from '../../services/onboardingService';

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

  // Move darkMode state and toggle function here
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(d => !d);

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
            let progress = null;
            try {
              const journey = await onboardingService.getJourney(member.id);
              progress = journey?.progress?.overall ?? null;
            } catch {
              progress = null;
            }
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

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStageColor = (stage: string | undefined) => {
    switch (normalizeStage(stage)) {
      case 'prepare': return 'bg-blue-100 text-blue-800';
      case 'orient': return 'bg-yellow-100 text-yellow-800';
      case 'land': return 'bg-purple-100 text-purple-800';
      case 'integrate': return 'bg-green-100 text-green-800';
      case 'excel': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate quick stats
  const avgProgress = teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum, m) => sum + (m.progress || 0), 0) / teamMembers.length) : 0;
  const needsAttention = teamMembers.filter(m => (m.progress ?? 100) < 60);

  return (
    <div className={darkMode ? 'dark bg-gray-900 min-h-screen text-gray-100' : 'bg-gray-50 min-h-screen text-gray-900'}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
          <p className="text-lg text-gray-500 dark:text-gray-300 mt-1">You’re making a difference! Here’s what’s happening with your team.</p>
        </div>
        <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
          {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Total Team</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Avg. Progress</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4">
          <ClipboardCheck className="h-8 w-8 text-orange-500" />
          <div>
            <div className="text-2xl font-bold">{pendingEvaluations.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Pending Evaluations</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4">
          <Calendar className="h-8 w-8 text-purple-500" />
          <div>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Upcoming Events</div>
          </div>
        </div>
      </div>

      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg shadow p-4 mb-8">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="font-semibold text-yellow-800 dark:text-yellow-200">Needs Attention</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {needsAttention.map(member => (
              <div key={member.id} className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded p-3 shadow">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-yellow-200 text-yellow-800">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">Progress: <span className="font-semibold text-yellow-700 dark:text-yellow-200">{member.progress ?? 0}%</span></div>
                </div>
                <Link to={`/team`} className="ml-4 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-bold">Team Members</h2>
          <Link to="/team" className="ml-auto px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => (
            <div key={member.id} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 rounded p-4 shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-blue-200 text-blue-800">
                {getInitials(member.name)}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{member.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">{member.role || 'Employee'} • {member.program || 'Program'}</div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(member.stage)}`}>{member.stage || 'N/A'}</span>
                  <span className="text-xs text-gray-400">{member.daysInProgram ? `${member.daysInProgram} days` : ''}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${member.progress ?? 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">Progress: {member.progress ?? 0}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Evaluations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <ClipboardCheck className="h-6 w-6 text-orange-500 mr-2" />
          <h2 className="text-xl font-bold">Pending Evaluations</h2>
          <Link to="/supervisor/evaluations" className="ml-auto px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200">View All</Link>
        </div>
        {pendingEvaluations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300 text-center py-2">No pending evaluations</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingEvaluations.map((evaluation) => (
              <li key={evaluation.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{evaluation.employeeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">{evaluation.type}</div>
                </div>
                <div className="text-xs text-gray-400">Due: {formatDate(evaluation.dueDate)}</div>
                <Link to={`/supervisor/evaluations/${evaluation.id}/form`} className="ml-4 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200">Review</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming Events Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Calendar className="h-6 w-6 text-purple-500 mr-2" />
          <h2 className="text-xl font-bold">Upcoming Events</h2>
          <Link to="/calendar" className="ml-auto px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200">View All</Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300 text-center py-2">No upcoming events</p>
        ) : (
          <ol className="relative border-l border-purple-200 dark:border-purple-700">
            {upcomingEvents.map((event, idx) => (
              <li key={event.id} className="mb-6 ml-4">
                <div className="absolute w-3 h-3 bg-purple-400 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900"></div>
                <time className="mb-1 text-xs font-normal leading-none text-purple-500 dark:text-purple-300">{formatDate(event.startDate || event.date)} {formatTime(event.startDate || event.date)}</time>
                <div className="text-md font-semibold text-gray-900 dark:text-gray-100">{event.title}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Quick Actions */}
      {/* Removed: Supervisors cannot assign checklists, schedule evaluations, or send reminders */}
    </div>
  );
};

export default SupervisorDashboard;