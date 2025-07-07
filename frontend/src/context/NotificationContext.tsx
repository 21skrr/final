import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { Notification } from '../types/user';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  fetchRoleBasedNotifications: (type: string) => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getNotificationCount: (type: string) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleBasedNotifications = async (type: string): Promise<Notification[]> => {
    try {
      let data: Notification[] = [];

      switch (type) {
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
        case 'team-progress':
          if (user?.role === 'supervisor') {
            data = await notificationService.getTeamProgress();
          }
          break;
        case 'feedback-submissions':
          if (user?.role === 'supervisor') {
            data = await notificationService.getFeedbackSubmissions();
          }
          break;
        case 'onboarding-milestones':
          if (user?.role === 'manager') {
            data = await notificationService.getOnboardingMilestones();
          }
          break;
        case 'pending-approvals':
          if (user?.role === 'manager') {
            data = await notificationService.getPendingApprovals();
          }
          break;
        case 'team-followups':
          if (user?.role === 'manager') {
            data = await notificationService.getTeamFollowups();
          }
          break;
        case 'weekly-reports':
          if (user?.role === 'manager' || user?.role === 'hr') {
            data = await notificationService.getWeeklyReports();
          }
          break;
        case 'system-alerts':
          if (user?.role === 'hr') {
            data = await notificationService.getSystemAlerts();
          }
          break;
        case 'new-employees':
          if (user?.role === 'hr') {
            data = await notificationService.getNewEmployees();
          }
          break;
        case 'compliance-alerts':
          if (user?.role === 'hr') {
            data = await notificationService.getComplianceAlerts();
          }
          break;
        case 'leave-requests':
          if (user?.role === 'hr') {
            data = await notificationService.getLeaveRequests();
          }
          break;
        case 'probation-deadlines':
          if (user?.role === 'supervisor' || user?.role === 'manager' || user?.role === 'hr') {
            data = await notificationService.getProbationDeadlines();
          }
          break;
        default:
          data = await notificationService.getNotifications();
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      return [];
    }
  };

  const getNotificationCount = (type: string): number => {
    return notifications.filter(n => n.type === type && !n.isRead).length;
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      // If no user, clear notifications and stop loading
      setNotifications([]);
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
        console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
        console.error("Failed to mark all notifications as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
        console.error("Failed to delete notification", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        fetchRoleBasedNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 