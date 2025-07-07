import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { Calendar, CheckSquare, FileText, Award, Clock } from 'lucide-react';
import OnboardingProgress from './OnboardingProgress';
import { Link } from 'react-router-dom';
import eventService from '../../services/eventService';
import checklistAssignmentService from '../../services/checklistAssignmentService';
import surveyService from '../../services/surveyService';
import analyticsService from '../../services/analyticsService';

interface EmployeeDashboardProps {
  user: User;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [learning, setLearning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch events
        const events = await eventService.getEvents();
        // Filter for upcoming events (future dates, limit 3)
        const now = new Date();
        const upcoming = events
          .filter((e: any) => new Date(e.startDate || e.date) > now)
          .sort((a: any, b: any) => new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);

        // Fetch tasks (checklist assignments)
        const assignments = await checklistAssignmentService.getMyAssignments();
        console.log('Assignments:', assignments);
        // Flatten checklist items, but if no items, use the assignment itself as a task
        let allTasks: any[] = [];
        assignments.forEach((assignment: any) => {
          if (assignment.items && assignment.items.length > 0) {
            assignment.items.forEach((item: any) => {
              allTasks.push({
                id: item.id,
                title: item.title,
                dueDate: item.dueDate || assignment.dueDate,
                isCompleted: item.isCompleted,
                priority: item.priority || 'medium',
              });
            });
          } else {
            // If no items, treat the assignment as a single task
            allTasks.push({
              id: assignment.id,
              title: assignment.title,
              dueDate: assignment.dueDate,
              isCompleted: assignment.isCompleted || false,
              priority: assignment.priority || 'medium',
            });
          }
        });
        // Prefer incomplete tasks, but if none, show completed ones
        let incompleteTasks = allTasks.filter(t => !t.isCompleted);
        let displayTasks = incompleteTasks.length > 0 ? incompleteTasks : allTasks;
        displayTasks = displayTasks.sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()).slice(0, 4);
        console.log('Dashboard Tasks:', displayTasks);
        setTasks(displayTasks);

        // Fetch available surveys
        const surveyRes = await surveyService.getAvailableSurveys();
        setSurveys(surveyRes.data || surveyRes);

        // Fetch learning progress
        const learningRes = await analyticsService.getPersonalTraining();
        setLearning(learningRes);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">
          You're in the {user.programType ? user.programType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : ''} program. 
          {user.onboardingStage && (
            <span> Currently in the <strong className="text-blue-600 capitalize">{user.onboardingStage}</strong> stage of your onboarding journey.</span>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OnboardingProgress user={user} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">Upcoming Events</h2>
            </div>
            <div className="p-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          event.type === 'meeting' ? 'bg-blue-100 text-blue-800' : 
                          event.type === 'training' ? 'bg-purple-100 text-purple-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(event.startDate || event.date)} at {formatTime(event.startDate || event.date)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link
                  to="/calendar"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View full calendar →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-orange-500 text-white flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">Tasks</h2>
            </div>
            <div className="p-4">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks to display</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <li key={task.id} className="py-3 flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          defaultChecked={task.isCompleted}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <p className={`text-sm font-medium ${
                            task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link
                  to="/checklists"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all tasks →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-purple-600 text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-medium">Upcoming Surveys</h2>
          </div>
          <div className="p-4">
            {surveys.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming surveys</p>
            ) : (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-800">{surveys[0].title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {surveys[0].description || 'Please share your feedback on your onboarding experience so far.'}
                </p>
                <div className="mt-3">
                  <Link
                    to={`/forms/${surveys[0].id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Complete Survey
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-600 text-white flex items-center">
            <Award className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-medium">Learning & Development</h2>
          </div>
          <div className="p-4">
            {learning ? (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-gray-900">{learning.title || 'Learning Module'}</h3>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${learning.progress || 0}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Progress: {learning.progress || 0}%</span>
                    <span className="text-xs text-gray-500">{learning.completedModules || 0}/{learning.totalModules || 0} Modules</span>
                  </div>
                  <div className="mt-3">
                    <Link
                      to="/training"
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Continue Learning →
                    </Link>
                  </div>
                </div>
                {/* Add more learning recommendations if available */}
                {learning.recommendations && learning.recommendations.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <h3 className="font-medium text-gray-900">Recommended for You</h3>
                    <p className="text-sm text-gray-600 mt-1">{learning.recommendations[0].description}</p>
                    <div className="mt-3">
                      <Link
                        to={learning.recommendations[0].link || '/training'}
                        className="text-sm font-medium text-green-600 hover:text-green-500"
                      >
                        Start Course →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No learning data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;