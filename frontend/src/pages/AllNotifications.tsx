import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Bell, Check, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

const AllNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Onboarding Checklist Updated',
      message: 'Your supervisor has updated your onboarding checklist with new tasks.',
      type: 'info',
      isRead: false,
      createdAt: '2024-03-10T14:30:00Z',
    },
    {
      id: '2',
      title: 'Evaluation Due Soon',
      message: 'Your 3-month evaluation is due in 5 days. Please prepare necessary documents.',
      type: 'warning',
      isRead: false,
      createdAt: '2024-03-09T09:15:00Z',
    },
    {
      id: '3',
      title: 'Training Completed',
      message: 'Congratulations! You have successfully completed the "Introduction to PMI" training.',
      type: 'success',
      isRead: true,
      createdAt: '2024-03-05T16:45:00Z',
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your notifications
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIconForType(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-900' : 'text-blue-900'
                      }`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No notifications to display
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllNotifications;