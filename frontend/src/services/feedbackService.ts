import api from './api';
import { 
  Feedback, 
  CreateFeedbackRequest, 
  FeedbackResponse, 
  FeedbackCategorization, 
  FeedbackEscalation, 
  FeedbackAnalytics, 
  FeedbackFilters, 
  FeedbackExportOptions 
} from '../types/feedback';

const feedbackService = {
  // Employee endpoints
  getMyFeedbackHistory: async (): Promise<Feedback[]> => {
    const response = await api.get('/feedback/history');
    return Array.isArray(response.data.feedback) ? response.data.feedback : [];
  },

  submitFeedback: async (feedbackData: CreateFeedbackRequest): Promise<Feedback> => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  // Supervisor endpoints
  getTeamFeedback: async (): Promise<Feedback[]> => {
    const response = await api.get('/team/feedback');
    return Array.isArray(response.data) ? response.data : [];
  },

  respondToFeedback: async (feedbackId: string, responseData: FeedbackResponse): Promise<any> => {
    const response = await api.post(`/feedback/${feedbackId}/response`, responseData);
    return response.data;
  },

  // Manager endpoints
  getDepartmentFeedback: async (filters?: FeedbackFilters): Promise<Feedback[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    
    const response = await api.get(`/feedback/department?${params.toString()}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getDepartmentAnalytics: async (filters?: FeedbackFilters): Promise<FeedbackAnalytics> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/feedback/analytics?${params.toString()}`);
    return response.data;
  },

  // HR endpoints
  getAllFeedback: async (filters?: FeedbackFilters): Promise<Feedback[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get(`/feedback/all?${params.toString()}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  categorizeFeedback: async (feedbackId: string, categorization: FeedbackCategorization): Promise<Feedback> => {
    const response = await api.put(`/feedback/${feedbackId}/categorize`, categorization);
    return response.data;
  },

  escalateFeedback: async (feedbackId: string, escalation: FeedbackEscalation): Promise<any> => {
    const response = await api.post(`/feedback/${feedbackId}/escalate`, escalation);
    return response.data;
  },

  exportFeedback: async (options: FeedbackExportOptions): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.dateRange) params.append('dateRange', options.dateRange);
    if (options.category) params.append('category', options.category);
    
    const response = await api.get(`/feedback/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Additional endpoints
  getSentFeedback: async (): Promise<Feedback[]> => {
    const response = await api.get('/feedback/sent');
    return response.data;
  },

  getReceivedFeedback: async (): Promise<Feedback[]> => {
    const response = await api.get('/feedback/received');
    return response.data;
  },

  getFeedbackByUserId: async (userId: string): Promise<Feedback[]> => {
    const response = await api.get(`/feedback/user/${userId}`);
    return response.data;
  },

  editFeedback: async (feedbackId: string, content: string): Promise<Feedback> => {
    const response = await api.put(`/feedback/${feedbackId}/edit`, { content });
    return response.data;
  },

  deleteFeedback: async (feedbackId: string): Promise<void> => {
    await api.delete(`/feedback/${feedbackId}`);
  },

  addFeedbackNotes: async (feedbackId: string, note: string, status?: string, followUpDate?: string): Promise<any> => {
    const response = await api.post(`/feedback/${feedbackId}/notes`, {
      notes: note,
      status,
      followUpDate
    });
    return response.data;
  },

  addFeedbackFollowup: async (feedbackId: string, followupData: {
    scheduledDate: string;
    participants: string[];
    notes: string;
  }): Promise<any> => {
    const response = await api.post(`/feedback/${feedbackId}/followup`, followupData);
    return response.data;
  }
};

export default feedbackService;