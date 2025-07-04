import api from './api';
import {
  OnboardingJourney,
  OnboardingProgressResponse,
  EmployeeOnboarding,
  OnboardingDashboardData,
  UserTaskProgress,
  OnboardingStage,
  Task
} from '../types/onboarding';

class OnboardingService {
  // Employee endpoints (read-only)
  async getMyProgress(): Promise<OnboardingProgressResponse> {
    const response = await api.get('/onboarding/progress/me');
    return response.data;
  }

  async getTasksByPhase(phase: string): Promise<any> {
    const response = await api.get(`/onboarding/phase/${phase}/tasks`);
    return response.data;
  }

  async getDetailedProgress(): Promise<any> {
    const response = await api.get('/onboarding/progress/detailed');
    return response.data;
  }

  // Supervisor endpoints (for direct reports)
  async getUserProgress(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.get(`/onboarding/progress/${userId}`);
    return response.data;
  }

  async updateUserProgress(userId: string, data: any): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/progress/${userId}`, data);
    return response.data;
  }

  async advanceToNextPhase(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/progress/${userId}/advance`);
    return response.data;
  }

  async updateTaskStatus(taskId: string, data: { completed: boolean; hrValidated?: boolean }): Promise<any> {
    const response = await api.put(`/onboarding/tasks/${taskId}/status`, data);
    return response.data;
  }

  async updateTaskCompletion(taskId: string, completed: boolean, userId?: string): Promise<any> {
    const response = await api.put(`/onboarding/tasks/${taskId}/complete`, { completed, userId });
    return response.data;
  }

  // Manager endpoints (read-only)
  async getUserProgressManager(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.get(`/onboarding/progress/${userId}/manager`);
    return response.data;
  }

  // HR endpoints (full access)
  async getAllProgresses(): Promise<OnboardingProgressResponse[]> {
    const response = await api.get('/onboarding/progress');
    return response.data;
  }

  async getUserProgressHR(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.get(`/onboarding/progress/${userId}/hr`);
    return response.data;
  }

  async updateUserProgressHR(userId: string, data: any): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/progress/${userId}/hr`, data);
    return response.data;
  }

  async advanceToNextPhaseHR(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/progress/${userId}/advance/hr`);
    return response.data;
  }

  async validateTask(taskId: string): Promise<any> {
    const response = await api.put(`/onboarding/tasks/${taskId}/validate`);
    return response.data;
  }

  async assignChecklists(userId: string, checklistIds: string[]): Promise<any> {
    const response = await api.post('/onboarding/assign', { userId, checklistIds });
    return response.data;
  }

  async resetJourney(userId: string, resetToStage?: string): Promise<any> {
    const response = await api.post(`/onboarding/${userId}/reset`, { resetToStage });
    return response.data;
  }

  async deleteUserProgress(userId: string): Promise<any> {
    const response = await api.delete(`/onboarding/${userId}`);
    return response.data;
  }

  async exportOnboardingCSV(): Promise<any> {
    const response = await api.get('/onboarding/export/csv');
    return response.data;
  }

  async createJourney(userId: string, templateId?: string): Promise<OnboardingProgressResponse> {
    const response = await api.post('/onboarding/create', { userId, templateId });
    return response.data;
  }

  async getDefaultTasks(): Promise<any> {
    const response = await api.get('/onboarding/tasks/default');
    return response.data;
  }

  // Legacy methods for backward compatibility
  async getJourney(userId?: string): Promise<OnboardingJourney> {
    if (userId) {
      // Use role-appropriate endpoint
      const response = await api.get(`/onboarding/progress/${userId}`);
      return response.data;
    } else {
      // Get own progress
      const response = await api.get('/onboarding/progress/me');
      return response.data;
    }
  }

  async updateTaskProgress(taskId: string, data: any): Promise<any> {
    // Use role-appropriate endpoint
    return this.updateTaskStatus(taskId, data);
  }

  async completeTask(userId: string, taskId: string): Promise<any> {
    // Use role-appropriate endpoint
    return this.updateTaskCompletion(taskId, true);
  }

  async verifyChecklistItem(progressId: string, status: 'approved' | 'rejected', notes?: string): Promise<any> {
    // This would need to be implemented based on your checklist system
    throw new Error('Method not implemented');
  }

  // Utility methods
  getPhaseTitle(stage: OnboardingStage): string {
    const titles = {
      prepare: 'Prepare',
      orient: 'Orient',
      land: 'Land',
      integrate: 'Integrate',
      excel: 'Excel'
    };
    return titles[stage] || stage;
  }

  getPhaseDescription(stage: OnboardingStage): string {
    const descriptions = {
      prepare: 'Complete paperwork, review materials, and set up accounts',
      orient: 'Attend orientation, meet the team, and receive equipment',
      land: 'Start self-study, get a buddy, and shadow interactions',
      integrate: 'Lead interactions, demonstrate autonomy, complete assessments',
      excel: 'Set up development plan, join coaching, and track KPIs'
    };
    return descriptions[stage] || '';
  }

  // Role-based permission checks
  canEditTasks(userRole: string): boolean {
    return ['hr', 'supervisor'].includes(userRole);
  }

  canAdvancePhases(userRole: string): boolean {
    return ['hr', 'supervisor'].includes(userRole);
  }

  canValidateTasks(userRole: string): boolean {
    return userRole === 'hr';
  }

  canAccessAllData(userRole: string): boolean {
    return userRole === 'hr';
  }

  canAccessDepartmentData(userRole: string): boolean {
    return ['hr', 'manager'].includes(userRole);
  }

  canAccessDirectReports(userRole: string): boolean {
    return ['hr', 'supervisor'].includes(userRole);
  }

  canAccessOwnData(userRole: string): boolean {
    return ['employee', 'supervisor', 'manager', 'hr'].includes(userRole);
  }
}

export default new OnboardingService();