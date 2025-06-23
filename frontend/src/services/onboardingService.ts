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
  // Employee endpoints
  async getMyProgress(): Promise<OnboardingProgressResponse> {
    const response = await api.get('/onboarding/progress/me');
    return response.data;
  }

  async updateMyProgress(data: { taskId: string; completed: boolean }): Promise<OnboardingProgressResponse> {
    const response = await api.put('/onboarding/progress/me', data);
    return response.data;
  }

  // HR/Supervisor endpoints
  async getUserProgress(userId: string): Promise<OnboardingProgressResponse> {
    const response = await api.get(`/onboarding/progress/${userId}`);
    return response.data;
  }

  async updateUserProgress(
    userId: string, 
    data: { stage?: OnboardingStage; progress?: number }
  ): Promise<OnboardingProgressResponse> {
    const response = await api.put(`/onboarding/progress/${userId}`, data);
    return response.data;
  }

  async getAllProgresses(): Promise<EmployeeOnboarding[]> {
    const response = await api.get('/onboarding/progress');
    return response.data;
  }

  async deleteJourney(userId: string): Promise<void> {
    await api.delete(`/onboarding/progress/${userId}`);
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
    const response = await api.put(`/onboarding/progress/${userId}/advance`);
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
    const endpoint = userId ? `/onboarding/progress/${userId}` : '/onboarding/progress/me';
    const response = await api.get(endpoint);
    const progressData = response.data;
    try {
      // Get all tasks for the user (or specified user)
      const tasksEndpoint = userId ? `/tasks/employee/${userId}` : '/tasks';
      const tasksResponse = await api.get(tasksEndpoint);
      const allTasks: Task[] = tasksResponse.data || [];

      // Group tasks by onboardingStage
      const stagesList: OnboardingStage[] = ['prepare', 'orient', 'land', 'integrate', 'excel'];
      const phases = stagesList.map(stage => {
        const stageTasks = allTasks.filter((task: Task) => task.stage === stage);
        const completedTasks = stageTasks.filter(t => t.completed).length;
        const completionPercentage = stageTasks.length > 0 ? Math.round((completedTasks / stageTasks.length) * 100) : 0;
        return {
          stage,
          title: this.getPhaseTitle(stage),
          description: this.getPhaseDescription(stage),
          tasks: stageTasks,
          completionPercentage,
          isActive: progressData.stage === stage,
          isCompleted: completionPercentage === 100,
        };
      });

      // Create the journey object
      const journey: OnboardingJourney = {
        user: progressData.User,
        progress: progressData,
        phases,
        overallProgress: progressData.progress,
        currentStage: progressData.stage,
        tasksCompleted: allTasks.filter((task: Task) => task.completed).length,
        totalTasks: allTasks.length
      };
      return journey;
    } catch (error) {
      console.error('Error fetching task data:', error);
      // Fallback to a basic journey structure
      return {
        user: progressData.User,
        progress: progressData,
        phases: [],
        overallProgress: progressData.progress,
        currentStage: progressData.stage,
        tasksCompleted: 0,
        totalTasks: 0
      };
    }
  }

  // Add function to create new onboarding journey
  async createJourney(userId: string, templateId?: string): Promise<OnboardingProgressResponse> {
    const response = await api.post('/onboarding/create', { userId, templateId });
    return response.data;
  }

  // Add function to assign onboarding template
  async assignTemplate(userId: string, templateId: string): Promise<OnboardingProgressResponse> {
    const response = await api.post(`/onboarding/progress/${userId}/template`, { templateId });
    return response.data;
  }

  // Fetch all default onboarding tasks grouped by stage
  async getDefaultTasks(): Promise<Record<string, unknown[]>> {
    const response = await api.get('/onboarding/tasks/default');
    return response.data;
  }

  // HR/manager verification of checklist item
  async verifyChecklistItem(progressId: string, verificationStatus: 'approved' | 'rejected', verificationNotes?: string): Promise<any> {
    const response = await api.patch(`/checklist-progress/${progressId}/verify`, {
      verificationStatus,
      verificationNotes
    });
    return response.data;
  }
}

export default new OnboardingService();