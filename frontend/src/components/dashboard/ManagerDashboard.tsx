import React from 'react';
import { User } from '../../types/user';
import { Users, ClipboardCheck, Calendar, BarChart2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ManagerDashboardProps {
  user: User;
}

// Mock data for team overview
const teamOverview = {
  totalEmployees: 18,
  inOnboarding: 5,
  completedOnboarding: 13,
  programDistribution: [
    { program: 'INKOMPASS', count: 3, color: 'bg-blue-500' },
    { program: 'Early Talent', count: 8, color: 'bg-green-500' },
    { program: 'Apprenticeship', count: 4, color: 'bg-yellow-500' },
    { program: 'Academic Placement', count: 2, color: 'bg-purple-500' },
    { program: 'Work Experience', count: 1, color: 'bg-red-500' },
  ]
};

// Mock data for pending reviews
const pendingReviews = [
  { 
    id: '1', 
    employeeName: 'Alex Johnson', 
    evaluationType: 'Probation End', 
    dueDate: '2023-10-15',
    supervisorName: 'Sarah Supervisor'
  },
  { 
    id: '2', 
    employeeName: 'Marco Torres', 
    evaluationType: 'Mid-Program', 
    dueDate: '2023-10-12',
    supervisorName: 'Sarah Supervisor'
  },
];

// Mock data for upcoming events
const upcomingEvents = [
  { id: '1', title: 'Team Performance Review', date: '2023-10-18T10:00:00', type: 'meeting' },
  { id: '2', title: 'New Hire Introduction', date: '2023-10-15T14:30:00', type: 'event' },
  { id: '3', title: 'Development Program Planning', date: '2023-10-20T09:00:00', type: 'planning' },
];

// Mock data for performance metrics
const performanceMetrics = [
  { category: 'Training Completion', value: 87, target: 90, unit: '%' },
  { category: 'Onboarding Satisfaction', value: 4.2, target: 4.0, unit: '/5' },
  { category: 'Time to Productivity', value: 42, target: 45, unit: 'days' },
  { category: 'Retention Rate', value: 92, target: 90, unit: '%' },
];

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPerformanceColor = (value: number, target: number) => {
    if (value >= target) return 'text-green-600';
    if (value >= target * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">
          You have {pendingReviews.length} evaluations awaiting your review and {upcomingEvents.length} upcoming events.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-blue-100 p-3 mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{teamOverview.totalEmployees}</span>
          <span className="text-sm text-gray-500">Total Team Members</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-yellow-100 p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900">{teamOverview.inOnboarding}</span>
          <span className="text-sm text-gray-500">In Onboarding</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-green-100 p-3 mb-3">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{teamOverview.completedOnboarding}</span>
          <span className="text-sm text-gray-500">Completed Onboarding</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-purple-100 p-3 mb-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{pendingReviews.length}</span>
          <span className="text-sm text-gray-500">Pending Reviews</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Team Performance</h2>
            </div>
            <Link to="/reports" className="text-sm text-blue-100 hover:text-white">
              View Reports
            </Link>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{metric.category}</h3>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getPerformanceColor(metric.value, metric.target)}`}>
                      {metric.value}{metric.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      Target: {metric.target}{metric.unit}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${
                        metric.value >= metric.target ? 'bg-green-500' : 
                        metric.value >= metric.target * 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                      } h-2 rounded-full`} 
                      style={{ width: `${(metric.value / (metric.target * 1.2)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-sm font-medium text-gray-700 mb-3">Program Distribution</h3>
            <div className="space-y-3">
              {teamOverview.programDistribution.map((program) => (
                <div key={program.program} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{program.program}</span>
                      <span className="text-sm font-medium text-gray-700">{program.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${program.color} h-2.5 rounded-full`} 
                        style={{ width: `${(program.count / teamOverview.totalEmployees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-orange-500 p-4 text-white flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Evaluations to Review</h2>
            </div>
            
            <div className="p-4">
              {pendingReviews.length === 0 ? (
                <p className="text-center text-gray-500 py-2">No pending reviews</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {pendingReviews.map((review) => (
                    <li key={review.id} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">{review.employeeName}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                          {review.evaluationType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Supervisor: {review.supervisorName}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Due: {review.dueDate}</span>
                        <Link 
                          to={`/evaluations/review/${review.id}`} 
                          className="text-xs font-medium text-blue-600 hover:text-blue-500"
                        >
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="mt-4">
                <Link
                  to="/evaluations/pending"
                  className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  View All Evaluations
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-600 p-4 text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Upcoming Events</h2>
            </div>
            
            <div className="p-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-gray-500 py-2">No upcoming events</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeClass(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(event.date)} at {formatTime(event.date)}
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
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Quick Team Overview</h2>
          </div>
          <Link to="/team" className="text-sm text-gray-300 hover:text-white">
            View All
          </Link>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">INKOMPASS</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Team Members:</span>
                <span className="font-medium text-gray-700">3</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Avg. Progress:</span>
                <span className="font-medium text-gray-700">72%</span>
              </div>
              <Link to="/programs/inkompass" className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-500 block">
                View Program →
              </Link>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-medium text-green-700 mb-2">Early Talent</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Team Members:</span>
                <span className="font-medium text-gray-700">8</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Avg. Progress:</span>
                <span className="font-medium text-gray-700">85%</span>
              </div>
              <Link to="/programs/early-talent" className="mt-3 text-xs font-medium text-green-600 hover:text-green-500 block">
                View Program →
              </Link>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <h3 className="font-medium text-yellow-700 mb-2">Apprenticeship</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Team Members:</span>
                <span className="font-medium text-gray-700">4</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Avg. Progress:</span>
                <span className="font-medium text-gray-700">60%</span>
              </div>
              <Link to="/programs/apprenticeship" className="mt-3 text-xs font-medium text-yellow-600 hover:text-yellow-500 block">
                View Program →
              </Link>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-medium text-purple-700 mb-2">Academic</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Team Members:</span>
                <span className="font-medium text-gray-700">3</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Avg. Progress:</span>
                <span className="font-medium text-gray-700">45%</span>
              </div>
              <Link to="/programs/academic-placement" className="mt-3 text-xs font-medium text-purple-600 hover:text-purple-500 block">
                View Program →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;