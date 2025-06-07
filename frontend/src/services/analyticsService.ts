import api from './api';

export interface DashboardData {
  [key: string]: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  configuration: Record<string, any>;
  is_system_template: boolean;
}

export interface ReportSchedule {
  id: string;
  templateId: string;
  frequency: 'weekly' | 'monthly';
  targetRoles: string[];
}

const analyticsService = {
  // Employee Analytics
  getPersonalDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/personal/dashboard');
    return response.data;
  },

  getPersonalOnboarding: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/personal/onboarding');
    return response.data;
  },

  getPersonalChecklist: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/personal/checklist');
    return response.data;
  },

  getPersonalTraining: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/personal/training');
    return response.data;
  },

  getPersonalFeedback: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/personal/feedback');
    return response.data;
  },

  // Team Analytics (Supervisor)
  getTeamDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/team/dashboard');
    return response.data;
  },

  getTeamChecklistProgress: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/team/checklist-progress');
    return response.data;
  },

  getTeamTraining: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/team/training');
    return response.data;
  },

  getTeamFeedback: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/team/feedback');
    return response.data;
  },

  getTeamCoaching: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/team/coaching');
    return response.data;
  },

  // Department Analytics (Manager)
  getDepartmentDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/department/dashboard');
    return response.data;
  },

  getDepartmentOnboardingKPI: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/department/onboarding-kpi');
    return response.data;
  },

  getDepartmentProbation: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/department/probation');
    return response.data;
  },

  getDepartmentEvaluations: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/department/evaluations');
    return response.data;
  },

  getDepartmentFeedback: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/department/feedback');
    return response.data;
  },

  // Organization Analytics (HR)
  getOrganizationDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/dashboard');
    return response.data;
  },

  getCompletionRates: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/completion-rates');
    return response.data;
  },

  getFeedbackParticipation: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/feedback-participation');
    return response.data;
  },

  getSurveyTrends: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/survey-trends');
    return response.data;
  },

  getTrainingCompletion: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/training-completion');
    return response.data;
  },

  getEvaluationEffectiveness: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/organization/evaluation-effectiveness');
    return response.data;
  },

  // Reports
  getReportTemplates: async (): Promise<ReportTemplate[]> => {
    const response = await api.get('/reports/templates');
    return response.data;
  },

  createReportTemplate: async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    const response = await api.post('/reports/templates', template);
    return response.data;
  },

  updateReportTemplate: async (id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    const response = await api.put(`/reports/templates/${id}`, template);
    return response.data;
  },

  deleteReportTemplate: async (id: string): Promise<void> => {
    await api.delete(`/reports/templates/${id}`);
  },

  // Report Scheduling
  scheduleReport: async (schedule: Omit<ReportSchedule, 'id'>): Promise<ReportSchedule> => {
    const response = await api.post('/reports/schedule', schedule);
    return response.data;
  },

  updateReportSchedule: async (id: string, schedule: Partial<ReportSchedule>): Promise<ReportSchedule> => {
    const response = await api.put(`/reports/schedule/${id}`, schedule);
    return response.data;
  },

  deleteReportSchedule: async (id: string): Promise<void> => {
    await api.delete(`/reports/schedule/${id}`);
  }
};

export default analyticsService;