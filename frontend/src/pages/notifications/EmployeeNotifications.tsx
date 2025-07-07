import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Bell, Check, Clock, AlertCircle, CheckCircle, Info, Trash2, Filter, Settings, FileText, BookOpen, Users } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { Notification } from '../../types/user';
import { useNavigate } from 'react-router-dom';

const EmployeeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();

  const tabs = [
    { id: 'all', label: 'All Notifications', icon: Bell },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'coaching', label: 'Coaching Sessions', icon: Users },
    { id: 'overdue', label: 'Overdue Tasks', icon: AlertCircle },
    { id: 'feedback', label: 'Feedback Available', icon: CheckCircle },
  ];

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      let data: Notification[] = [];

      switch (activeTab) {
        case 'all':
          data = await notificationService.getNotifications();
          break;
        case 'reminders':
          data = await notificationService.getReminders();
          break;
        case 'documents':
          data = await notificationService.getDocumentNotifications();
          break;
        case 'training':
          data = await notificationService.getTrainingNotifications();
          break;
        case 'coaching':
          data = await notificationService.getCoachingSessionNotifications();
          break;
        case 'overdue':
          data = await notificationService.getOverdueTasks();
          break;
        case 'feedback':
          data = await notificationService.getFeedbackAvailability();
          break;
        default:
          data = await notificationService.getNotifications();
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'training':
        return <BookOpen className="h-5 w-5 text-indigo-500" />;
      case 'coaching_session':
        return <Users className="h-5 w-5 text-teal-500" />;
      case 'feedback_available':
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Notifications</h1>
          <p className="mt-2 text-gray-600">
            Stay updated with your onboarding progress, training sessions, and important reminders
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <span className="text-sm text-gray-500">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` (${unreadCount} unread)`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all as read
              </button>
            )}
            <button
              onClick={() => navigate('/settings?tab=notifications')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="h-4 w-4 mr-1" />
              Preferences
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'unread' ? 'You have no unread notifications.' : 'You have no notifications to display.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-150 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                          }`}>
                            {notification.title || 'Notification'}
                          </p>
                          {!notification.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeNotifications; 