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
  title: string;
  message: string;
  type: string;
  metadata?: any;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Role-based notification parameters
export interface TeamFollowupParams {
  department?: string;
  status?: string;
}

export interface ProbationDeadlineParams {
  daysUntil?: number;
  department?: string;
}

export interface WeeklyReportParams {
  department?: string;
  week?: string;
}

export interface SystemAlertParams {
  severity?: string;
  category?: string;
}

export interface NewEmployeeParams {
  days?: number;
  department?: string;
}

const notificationService = {
  // ===== GENERAL NOTIFICATION ENDPOINTS =====
  
  // Get all notifications for current user
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // ===== EMPLOYEE NOTIFICATION ENDPOINTS =====

  // Get reminders about upcoming or overdue onboarding tasks
  getReminders: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/reminders');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Check if any feedback forms are available
  getFeedbackAvailability: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/feedback-availability');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View alerts about new onboarding documents
  getDocumentNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/documents');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View notifications related to assigned training sessions
  getTrainingNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/training');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View coaching session reminders and scheduling updates
  getCoachingSessionNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/coaching-sessions');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get overdue tasks notifications
  getOverdueTasks: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/overdue-tasks');
    return Array.isArray(response.data) ? response.data : [];
  },

  // ===== SUPERVISOR NOTIFICATION ENDPOINTS =====

  // View progress updates and alerts for team members' onboarding tasks
  getTeamProgress: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/team-progress');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get notified about overdue team tasks based on severity and delay
  getOverdueTasksSupervisor: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/overdue-tasks');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View new feedback submitted by their team members
  getFeedbackSubmissions: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/feedback-submissions');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Monitor upcoming or pending probation deadlines of team members
  getProbationDeadlines: async (params?: ProbationDeadlineParams): Promise<Notification[]> => {
    const response = await api.get('/notifications/probation-deadlines', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // ===== MANAGER NOTIFICATION ENDPOINTS =====

  // Get updates about key onboarding stages across their department
  getOnboardingMilestones: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/onboarding-milestones');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View pending HR or workflow-related approvals they are responsible for
  getPendingApprovals: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/pending-approvals');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get follow-up reminders related to team development or onboarding
  getTeamFollowups: async (params?: TeamFollowupParams): Promise<Notification[]> => {
    const response = await api.get('/notifications/team-followups', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // ===== HR NOTIFICATION ENDPOINTS =====

  // Generate reports summarizing progress or engagement by period or department
  getSummaryReports: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/summary-reports');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View alerts related to critical errors, warnings, or backend failures
  getSystemAlerts: async (params?: SystemAlertParams): Promise<Notification[]> => {
    const response = await api.get('/notifications/system-alerts', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // Track alerts when new hires join, filterable by department/days
  getNewEmployees: async (params?: NewEmployeeParams): Promise<Notification[]> => {
    const response = await api.get('/notifications/new-employees', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // Monitor feedback cycles (e.g., 3-month, 6-month review checkpoints)
  getFeedbackCheckpoints: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/feedback-checkpoints');
    return Array.isArray(response.data) ? response.data : [];
  },

  // View weekly onboarding progress by department or week
  getWeeklyReports: async (params?: WeeklyReportParams): Promise<Notification[]> => {
    const response = await api.get('/notifications/weekly-reports', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // View alerts related to compliance issues, audits, or overdue policy acknowledgments
  getComplianceAlerts: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/compliance-alerts');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get notified of new or pending leave requests
  getLeaveRequests: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/leave-requests');
    return Array.isArray(response.data) ? response.data : [];
  },

  // ===== NOTIFICATION SETTINGS =====

  // Retrieve current notification preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  // Update notification preferences including channels, frequency, and quiet hours
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  // ===== NOTIFICATION TEMPLATES (HR Only) =====

  // List all pre-defined notification templates for reuse
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await api.get('/notifications/templates');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Create new notification templates with dynamic placeholders
  createTemplate: async (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> => {
    const response = await api.post('/notifications/templates', template);
    return response.data;
  },

  // Edit existing templates to change content, channels, or variables
  updateTemplate: async (templateId: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.put(`/notifications/templates/${templateId}`, template);
    return response.data;
  },

  // Remove obsolete or outdated templates from the system
  deleteTemplate: async (templateId: string): Promise<void> => {
    await api.delete(`/notifications/templates/${templateId}`);
  },

  // Get single template
  getTemplate: async (templateId: string): Promise<NotificationTemplate> => {
    const response = await api.get(`/notifications/templates/${templateId}`);
    return response.data;
  },

  // Send bulk notifications (HR)
  sendBulkNotification: async (payload: any): Promise<any> => {
    const response = await api.post('/notifications/send-bulk', payload);
    return response.data;
  }
};

export default notificationService;