import React, { useEffect, useRef } from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationsPanelProps {
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Info size={20} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 flex flex-col"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="font-semibold">You're all caught up!</p>
            <p className="text-sm">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition duration-150 ease-in-out ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconForType(notification.type)}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-md">
        <div className="flex justify-between items-center px-2">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium rounded disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
          <button
            onClick={handleViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium rounded"
          >
            View all
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;