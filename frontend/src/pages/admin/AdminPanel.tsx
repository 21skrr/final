import React from 'react';
import Layout from '../../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Users, Settings, BookOpen, BarChart2, Clock } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const adminModules = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      link: '/admin/users',
      color: 'border-blue-500',
    },
    {
      title: 'Program Management',
      description: 'Configure and manage onboarding programs',
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      link: '/admin/programs',
      color: 'border-green-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: <Settings className="h-8 w-8 text-purple-600" />,
      link: '/admin/settings',
      color: 'border-purple-500',
    },
    {
      title: 'Analytics & Metrics',
      description: 'View onboarding metrics and analytics',
      icon: <BarChart2 className="h-8 w-8 text-orange-600" />,
      link: '/admin/metrics',
      color: 'border-orange-500',
    },
    {
      title: 'Activity Logs',
      description: 'Monitor system activity and audit logs',
      icon: <Clock className="h-8 w-8 text-red-600" />,
      link: '/admin/activity',
      color: 'border-red-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage system settings, users, and monitor onboarding activities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Link
              key={module.title}
              to={module.link}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${module.color} hover:shadow-lg transition-shadow duration-200`}
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {module.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/users/new"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Add New Employee
            </Link>
            <Link
              to="/admin/roles"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Roles
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;