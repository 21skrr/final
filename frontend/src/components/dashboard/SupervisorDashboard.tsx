import React from 'react';
import { User } from '../../types/user';
import { Users, Calendar, ClipboardCheck, MessageSquare, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SupervisorDashboardProps {
  user: User;
}

// Mock data for team members
const teamMembers = [
  { 
    id: '101', 
    name: 'Alex Johnson', 
    role: 'Marketing Analyst', 
    program: 'earlyTalent',
    stage: 'land',
    progress: 60,
    daysInProgram: 15,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  { 
    id: '102', 
    name: 'Priya Sharma', 
    role: 'Junior Developer', 
    program: 'apprenticeship',
    stage: 'integrate',
    progress: 85,
    daysInProgram: 48,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  { 
    id: '103', 
    name: 'Marco Torres', 
    role: 'Operations Trainee', 
    program: 'inkompass',
    stage: 'excel',
    progress: 95,
    daysInProgram: 89,
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
  },
  { 
    id: '104', 
    name: 'Sophia Chen', 
    role: 'Finance Intern', 
    program: 'academicPlacement',
    stage: 'orient',
    progress: 25,
    daysInProgram: 3,
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
  },
];

// Mock data for pending evaluations
const pendingEvaluations = [
  { id: '201', employeeName: 'Alex Johnson', employeeId: '101', type: '30-day', dueDate: '2023-10-15' },
  { id: '202', employeeName: 'Priya Sharma', employeeId: '102', type: 'mid-program', dueDate: '2023-10-05' },
];

// Mock data for upcoming events
const upcomingEvents = [
  { id: '301', title: 'Team Onboarding Check-in', date: '2023-10-12T10:00:00', attendees: 4 },
  { id: '302', title: 'One-on-one with Marco', date: '2023-10-08T15:30:00', attendees: 1 },
  { id: '303', title: 'New Hire Orientation', date: '2023-10-18T09:00:00', attendees: 2 },
];

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  const getStageClass = (stage: string) => {
    switch (stage) {
      case 'prepare': return 'bg-gray-100 text-gray-800';
      case 'orient': return 'bg-blue-100 text-blue-800';
      case 'land': return 'bg-yellow-100 text-yellow-800';
      case 'integrate': return 'bg-purple-100 text-purple-800';
      case 'excel': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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
                <span className="block text-2xl font-bold text-yellow-500">2</span>
                <span className="text-sm text-gray-500">New</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-green-500">1</span>
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
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Members</h2>
          </div>
          <Link
            to="/team"
            className="text-sm text-blue-300 hover:text-blue-100"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    <div className="text-sm text-gray-500">{member.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {member.program.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageClass(member.stage)}`}>
                      {member.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${member.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{member.progress}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.daysInProgram}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/team/${member.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                      <Link to={`/evaluations/new/${member.id}`} className="text-green-600 hover:text-green-900">
                        Evaluate
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-600 text-white flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Performance</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Average Onboarding Progress</span>
                  <span className="text-sm font-medium text-gray-700">66%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Evaluation Completion Rate</span>
                  <span className="text-sm font-medium text-gray-700">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Training Completion</span>
                  <span className="text-sm font-medium text-gray-700">82%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                to="/reports"
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                View detailed reports →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-indigo-600 text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Feedback Summary</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Feedback Themes</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 w-32">Clear Goals</span>
                  <span className="text-sm font-medium text-gray-700">85%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 w-32">Supportive Team</span>
                  <span className="text-sm font-medium text-gray-700">78%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 w-32">Training Quality</span>
                  <span className="text-sm font-medium text-gray-700">65%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '52%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 w-32">Communication</span>
                  <span className="text-sm font-medium text-gray-700">52%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                to="/feedback"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all feedback →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;