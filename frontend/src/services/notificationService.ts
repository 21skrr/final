import api from './api';
import { Notification } from '../types/user';

export interface NotificationPreferences {
  emailNotifications: {
    checklistAssignments: boolean;
    reminders: boolean;
    feedbackForms: boolean;
    documents: boolean;
    coachingSessions: boolean;
  };
  inAppNotifications: {
    checklistAssignments: boolean;
    reminders: boolean;
    feedbackForms: boolean;
    documents: boolean;
    coachingSessions: boolean;
  };
  pushNotifications: {
    checklistAssignments: boolean;
    reminders: boolean;
    feedbackForms: boolean;
    documents: boolean;
    coachingSessions: boolean;
  };
  frequency: 'daily' | 'weekly' | 'monthly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
}

const notificationService = {
  // Get notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Specific notification types
  getReminders: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/reminders');
    return response.data;
  },

  getFeedbackAvailability: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/feedback-availability');
    return response.data;
  },

  getDocumentNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/documents');
    return response.data;
  },

  getTrainingNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/training');
    return response.data;
  },

  getCoachingSessionNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/coaching-sessions');
    return response.data;
  },

  // Mark notifications as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Notification preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  // Notification templates (HR)
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await api.get('/notifications/templates');
    return response.data;
  },

  createTemplate: async (template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> => {
    const response = await api.post('/notifications/templates', template);
    return response.data;
  },

  updateTemplate: async (templateId: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.put(`/notifications/templates/${templateId}`, template);
    return response.data;
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    await api.delete(`/notifications/templates/${templateId}`);
  }
};

export default notificationService;