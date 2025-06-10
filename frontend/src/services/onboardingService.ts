import api from './api';
import {
  OnboardingJourney,
  OnboardingProgressResponse,
  EmployeeOnboarding,
  OnboardingDashboardData,
  UserTaskProgress,
  OnboardingStage
} from '../types/onboarding';

class OnboardingService {
  // Employee endpoints
  async getMyProgress(): Promise<OnboardingProgressResponse> {
    const response = await api.get('/onboarding/journey');
    return response.data;
  }

  async updateMyProgress(data: { taskId: string; completed: boolean }): Promise<OnboardingProgressResponse> {
    const response = await api.put('/onboarding/journey', data);
    return response.data;
  }

  // HR/Supervisor endpoints
  async getUserProgress(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.get(`/onboarding/journey/${userId}`);
    return response.data;
  }

  async updateUserProgress(
    userId: string, 
    data: { stage?: OnboardingStage; progress?: number }
  ): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/journey/${userId}`, data);
    return response.data;
  }

  async getAllProgresses(): Promise<EmployeeOnboarding[]> {
    const response = await api.get('/onboarding/progresses');
    return response.data;
  }

  async deleteJourney(userId: string): Promise<void> {
    await api.delete(`/onboarding/journey/${userId}`);
  }

  // Task management
  async completeTask(taskId: string, notes?: string): Promise<UserTaskProgress> {
    const response = await api.put(`/tasks/${taskId}/complete`, { notes });
    return response.data;
  }

  async updateTaskProgress(
    taskId: string, 
    data: { isCompleted?: boolean; notes?: string; supervisorNotes?: string }
  ): Promise<UserTaskProgress> {
    // Use the correct endpoint
    if (data.supervisorNotes) {
      // If supervisor notes are provided, use the notes endpoint
      const response = await api.put(`/tasks/${taskId}/notes`, { supervisorNotes: data.supervisorNotes });
      return response.data;
    } else {
      // Otherwise use the progress endpoint
      const response = await api.put(`/tasks/${taskId}/progress`, { 
        isCompleted: data.isCompleted,
        notes: data.notes 
      });
      return response.data;
    }
  }

  // Dashboard data for different roles
  async getDashboardData(): Promise<OnboardingDashboardData> {
    const response = await api.get('/onboarding/dashboard');
    return response.data;
  }

  // Phase management
  async advanceToNextPhase(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/journey/${userId}/advance`);
    return response.data;
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
    return titles[stage];
  }

  getPhaseDescription(stage: OnboardingStage): string {
    const descriptions = {
      prepare: 'Complete paperwork, review materials, and set up accounts',
      orient: 'Attend orientation, meet the team, and receive equipment',
      land: 'Start self-study, get a buddy, and shadow interactions',
      integrate: 'Lead interactions, demonstrate autonomy, complete assessments',
      excel: 'Set up development plan, join coaching, and track KPIs'
    };
    return descriptions[stage];
  }

  // Replace the getJourney function with this implementation
  async getJourney(userId?: string): Promise<OnboardingJourney> {
    // Get user's onboarding progress
    const endpoint = userId ? `/onboarding/journey/${userId}` : '/onboarding/journey';
    const response = await api.get(endpoint);
    const progressData = response.data;
    
    try {
      // Get all tasks for the user (or specified user)
      const tasksEndpoint = userId ? `/tasks/employee/${userId}` : '/tasks';
      const tasksResponse = await api.get(tasksEndpoint);
      const allTasks = tasksResponse.data || [];
      
      // Filter tasks for current stage
      const stageTasks = allTasks.filter(
        (task: any) => task.onboardingStage === progressData.stage
      );
      
      // Create the journey object
      const journey: OnboardingJourney = {
        user: progressData.User,
        progress: progressData,
        stages: [{
          stage: progressData.stage,
          title: this.getPhaseTitle(progressData.stage),
          description: this.getPhaseDescription(progressData.stage),
          tasks: stageTasks,
          completionPercentage: progressData.progress,
          isActive: true,
          isCompleted: progressData.progress === 100
        }],
        overallProgress: progressData.progress,
        currentStage: progressData.stage,
        tasksCompleted: stageTasks.filter((task: any) => task.completed).length,
        totalTasks: stageTasks.length
      };
      
      return journey;
    } catch (error) {
      console.error('Error fetching task data:', error);
      
      // Fallback to a basic journey structure
      return {
        user: progressData.User,
        progress: progressData,
        stages: [{
          stage: progressData.stage,
          title: this.getPhaseTitle(progressData.stage),
          description: this.getPhaseDescription(progressData.stage),
          tasks: [],
          completionPercentage: progressData.progress,
          isActive: true,
          isCompleted: progressData.progress === 100
        }],
        overallProgress: progressData.progress,
        currentStage: progressData.stage,
        tasksCompleted: 0,
        totalTasks: 0
      };
    }
  }

  // Add function to create new onboarding journey
  async createJourney(userId: string, templateId?: string): Promise<OnboardingProgressResponse> {
    const response = await api.post('/onboarding/journey', { userId, templateId });
    return response.data;
  }

  // Add function to assign onboarding template
  async assignTemplate(userId: string, templateId: string): Promise<OnboardingProgressResponse> {
    const response = await api.post(`/onboarding/journey/${userId}/template`, { templateId });
    return response.data;
  }
}

export default new OnboardingService();