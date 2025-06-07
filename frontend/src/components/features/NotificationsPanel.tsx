import React from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Mock notifications
const mockNotifications = [
  {
    id: '1',
    userId: '1',
    title: 'Onboarding Checklist Updated',
    message: 'Your supervisor has updated your onboarding checklist with new tasks.',
    type: 'info' as const,
    isRead: false,
    createdAt: '2023-09-10T14:30:00Z',
    link: '/checklists',
  },
  {
    id: '2',
    userId: '1',
    title: 'Evaluation Due Soon',
    message: 'Your 3-month evaluation is due in 5 days. Please prepare necessary documents.',
    type: 'warning' as const,
    isRead: false,
    createdAt: '2023-09-09T09:15:00Z',
    link: '/evaluations',
  },
  {
    id: '3',
    userId: '1',
    title: 'Training Completed',
    message: 'Congratulations! You have successfully completed the "Introduction to PMI" training.',
    type: 'success' as const,
    isRead: true,
    createdAt: '2023-09-05T16:45:00Z',
    link: '/training',
  },
  {
    id: '4',
    userId: '1',
    title: 'Survey Reminder',
    message: 'Please complete your 3-month feedback survey by the end of this week.',
    type: 'error' as const,
    isRead: false,
    createdAt: '2023-09-02T11:20:00Z',
    link: '/forms',
  },
];

interface NotificationsPanelProps {
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;
  
  const userNotifications = mockNotifications.filter(n => n.userId === user.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkAllAsRead = () => {
    // In a real app, this would update the notifications in your state management system
    console.log('Marking all notifications as read');
    onClose();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[80vh] overflow-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell size={18} className="mr-2" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {userNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications to display
          </div>
        ) : (
          userNotifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.link || '#'}
              className={`block p-4 hover:bg-gray-50 transition duration-150 ease-in-out ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={onClose}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconForType(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
          <button
            onClick={handleViewAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;