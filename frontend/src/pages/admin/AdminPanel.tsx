import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Users, Briefcase, Settings, Bell, FileText, BarChart2, Calendar, MessageSquare, Edit } from 'lucide-react';

const adminFeatures = [
  { name: 'User Management', path: '/admin/users', icon: Users, description: 'Add, edit, and manage user accounts and roles.' },
  { name: 'Onboarding Management', path: '/admin/onboarding', icon: Briefcase, description: 'Configure onboarding programs and tasks.' },
  { name: 'Notification Templates', path: '/admin/notification-templates', icon: Bell, description: 'Create and edit notification templates.' },
  { name: 'Survey Templates', path: '/admin/survey-templates', icon: Edit, description: 'Create and manage reusable survey templates.' },
  { name: 'Monitor Surveys', path: '/admin/survey-monitoring', icon: BarChart2, description: 'Track survey progress and participation.' },
  { name: 'Survey Settings', path: '/admin/survey-settings', icon: MessageSquare, description: 'Configure global settings for all surveys.' },
  { name: 'System Settings', path: '/admin/settings', icon: Settings, description: 'Manage global application settings.' },
];

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Central hub for managing platform features, users, and content.</p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <div
              key={feature.name}
              onClick={() => navigate(feature.path)}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;