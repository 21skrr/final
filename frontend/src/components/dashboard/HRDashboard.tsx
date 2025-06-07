import React from 'react';
import { User } from '../../types/user';
import { UserPlus, Users, CalendarClock, ClipboardList, BarChart, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HRDashboardProps {
  user: User;
}

// Mock data for onboarding metrics
const onboardingMetrics = {
  activeEmployees: 24,
  pendingOnboarding: 5,
  completedThisMonth: 8,
  retentionRate: 92,
  programDistribution: [
    { program: 'INKOMPASS', count: 8, color: 'bg-blue-500' },
    { program: 'Early Talent', count: 12, color: 'bg-green-500' },
    { program: 'Apprenticeship', count: 6, color: 'bg-yellow-500' },
    { program: 'Academic Placement', count: 3, color: 'bg-purple-500' },
    { program: 'Work Experience', count: 2, color: 'bg-red-500' },
  ]
};

// Mock data for attention needed
const attentionItems = [
  { 
    id: '1', 
    type: 'probation', 
    employee: 'Alex Johnson', 
    dueDate: '2023-10-15', 
    status: 'pending',
    description: 'Probation period ending, evaluation needed'
  },
  { 
    id: '2', 
    type: 'survey', 
    employee: 'Sophia Chen', 
    dueDate: '2023-10-08', 
    status: 'overdue',
    description: '3-month survey completion is overdue'
  },
  { 
    id: '3', 
    type: 'onboarding', 
    employee: 'Marco Torres', 
    dueDate: '2023-10-10', 
    status: 'delayed',
    description: 'Onboarding progress stalled at "Land" stage'
  },
];

// Mock data for recent activities
const recentActivities = [
  { 
    id: '1', 
    activity: 'New hire onboarded', 
    details: 'Emily Davis joined Early Talent program', 
    date: '2023-10-02', 
    time: '09:15 AM'
  },
  { 
    id: '2', 
    activity: 'Probation completed', 
    details: 'James Wilson completed 3-month probation successfully', 
    date: '2023-10-01', 
    time: '02:30 PM'
  },
  { 
    id: '3', 
    activity: 'Survey results', 
    details: 'INKOMPASS program quarterly survey results available', 
    date: '2023-09-30', 
    time: '11:45 AM'
  },
  { 
    id: '4', 
    activity: 'Program updated', 
    details: 'Early Talent program onboarding checklist updated', 
    date: '2023-09-29', 
    time: '03:20 PM'
  },
];

const HRDashboard: React.FC<HRDashboardProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">
          You have {attentionItems.length} items requiring attention and {onboardingMetrics.pendingOnboarding} pending onboarding processes.
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/admin/users/new" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Add New Employee</h3>
            <p className="text-sm text-gray-500">Create a new onboarding</p>
          </div>
        </Link>
        
        <Link to="/admin/onboarding" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Manage Onboarding</h3>
            <p className="text-sm text-gray-500">View and manage employee onboarding</p>
          </div>
        </Link>
        
        <Link to="/admin/roles" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Manage Roles</h3>
            <p className="text-sm text-gray-500">Assign or update roles</p>
          </div>
        </Link>
        
        <Link to="/admin/programs" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-3">
            <ClipboardList className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Programs</h3>
            <p className="text-sm text-gray-500">Manage program details</p>
          </div>
        </Link>
        
        <Link to="/reports" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
          <div className="rounded-full bg-orange-100 p-3 mr-3">
            <BarChart className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Reports</h3>
            <p className="text-sm text-gray-500">View analytics & data</p>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding metrics */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Onboarding Metrics</h2>
            </div>
            <Link to="/reports" className="text-sm text-blue-100 hover:text-white">
              View All
            </Link>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <span className="block text-3xl font-bold text-gray-900">{onboardingMetrics.activeEmployees}</span>
                <span className="text-sm text-gray-500">Active Employees</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-yellow-500">{onboardingMetrics.pendingOnboarding}</span>
                <span className="text-sm text-gray-500">Pending Onboarding</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-green-500">{onboardingMetrics.completedThisMonth}</span>
                <span className="text-sm text-gray-500">Completed This Month</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-blue-500">{onboardingMetrics.retentionRate}%</span>
                <span className="text-sm text-gray-500">Retention Rate</span>
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-gray-700 mb-3">Program Distribution</h3>
            <div className="space-y-3">
              {onboardingMetrics.programDistribution.map((program) => (
                <div key={program.program} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{program.program}</span>
                      <span className="text-sm font-medium text-gray-700">{program.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${program.color} h-2.5 rounded-full`} 
                        style={{ width: `${(program.count / onboardingMetrics.activeEmployees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Items Needing Attention */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-600 p-4 text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Needs Attention</h2>
          </div>
          
          <div className="p-4">
            {attentionItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No items need attention</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {attentionItems.map((item) => (
                  <li key={item.id} className="py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{item.employee}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        item.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Due: {item.dueDate}</span>
                      <Link 
                        to={`/admin/${item.type}/${item.id}`} 
                        className="text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        Take action
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-4">
              <Link
                to="/admin/attention"
                className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                View All Items
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <CalendarClock className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Recent Activity</h2>
            </div>
            <Link to="/admin/activity" className="text-sm text-gray-300 hover:text-white">
              View All
            </Link>
          </div>
          
          <div className="p-4">
            <ul className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{activity.date}</p>
                      <p>{activity.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 p-4 text-white">
            <h2 className="text-lg font-medium">Quick Links</h2>
          </div>
          
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/admin/users" 
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 hover:text-gray-900 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gray-500" />
                    <span>User Management</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/forms/create" 
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 hover:text-gray-900 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2 text-gray-500" />
                    <span>Create New Form</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports/export" 
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 hover:text-gray-900 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-gray-500" />
                    <span>Export Reports</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/settings" 
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 hover:text-gray-900 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>System Settings</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;