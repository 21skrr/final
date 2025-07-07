import api from './api';
import { ChecklistAssignmentDetail, ChecklistProgressItem } from '../types/checklist';

const checklistAssignmentService = {
  // Get all assignments for the current user
  getMyAssignments: async (): Promise<ChecklistAssignmentDetail[]> => {
    const response = await api.get('/checklist-assignments/my');
    return response.data;
  },

  // Get assignments for a specific user (HR/Manager/Supervisor only)
  getUserAssignments: async (userId: string): Promise<ChecklistAssignmentDetail[]> => {
    const response = await api.get(`/checklist-assignments/user/${userId}`);
    return response.data;
  },

  // Get assignments by department (Manager/HR only)
  getDepartmentAssignments: async (department: string): Promise<ChecklistAssignmentDetail[]> => {
    const response = await api.get(`/checklist-assignments/department/${department}`);
    return response.data;
  },

  // Get assignments by team (Supervisor/HR only)
  getTeamAssignments: async (teamId: string): Promise<ChecklistAssignmentDetail[]> => {
    const response = await api.get(`/checklist-assignments/team/${teamId}`);
    return response.data;
  },

  // Get a specific assignment by ID
  getAssignmentById: async (assignmentId: string): Promise<ChecklistAssignmentDetail> => {
    const response = await api.get(`/checklist-assignments/${assignmentId}`);
    return response.data;
  },

  // Get items for a specific assignment
  getAssignmentItems: async (assignmentId: string): Promise<ChecklistProgressItem[]> => {
    const response = await api.get(`/checklist-assignments/${assignmentId}/items`);
    return response.data;
  },

  // Get progress for a specific assignment
  getAssignmentProgress: async (assignmentId: string): Promise<{completionPercentage: number}> => {
    const response = await api.get(`/checklist-assignments/${assignmentId}/progress`);
    return response.data;
  },

  // Assign checklist to a user (HR/Manager only)
  assignChecklist: async (assignment: {
    userId: string;
    checklistId: string;
    dueDate?: string;
    isAutoAssigned?: boolean;
  }): Promise<ChecklistAssignmentDetail> => {
    const response = await api.post('/checklist-assignments', assignment);
    return response.data;
  },

  // Bulk assign checklist to multiple users (HR/Manager only)
  bulkAssignChecklist: async (bulkAssignment: {
    checklistId: string;
    userIds: string[];
    dueDate?: string;
    isAutoAssigned?: boolean;
  }): Promise<ChecklistAssignmentDetail[]> => {
    const response = await api.post('/checklist-assignments/bulk', bulkAssignment);
    return response.data;
  },

  // Update checklist progress (Employee)
  updateProgress: async (progressId: string, update: {
    isCompleted: boolean;
    notes?: string;
    completedAt?: string;
    userId: string;
    checklistItemId: string;
  }): Promise<ChecklistProgressItem> => {
    const response = await api.patch(`/checklist-assignments/checklist-progress/${progressId}`, update);
    return response.data;
  },

  // Verify checklist item (HR/Manager/Supervisor only)
  verifyChecklistItem: async (progressId: string, verification: {
    verificationStatus: 'approved' | 'rejected';
    verificationNotes?: string;
  }): Promise<ChecklistProgressItem> => {
    const response = await api.patch(`/checklist-assignments/checklist-progress/${progressId}/verify`, verification);
    return response.data;
  },

  // Send reminder for a checklist item
  sendReminder: async (itemId: string, note: string): Promise<void> => {
    const response = await api.post(`/checklist-assignments/checklist-progress/${itemId}/reminder`, { note });
    return response.data;
  },

  // Get progress for a specific user and checklist
  getChecklistProgressByUserAndChecklist: async (userId: string, checklistId: string): Promise<ChecklistProgressItem[]> => {
    const response = await api.get(`/checklist-assignments/progress/${userId}/${checklistId}`);
    return response.data;
  },

  // Get department analytics (Manager/HR only)
  getDepartmentAnalytics: async (department: string): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    inProgressAssignments: number;
    overdueAssignments: number;
    completionRate: number;
    assignmentsByStage: Record<string, number>;
  }> => {
    const response = await api.get(`/checklist-assignments/analytics/department/${department}`);
    return response.data;
  },

  // Get team analytics (Supervisor/HR only)
  getTeamAnalytics: async (teamId: string): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    inProgressAssignments: number;
    overdueAssignments: number;
    completionRate: number;
    assignmentsByStage: Record<string, number>;
  }> => {
    const response = await api.get(`/checklist-assignments/analytics/team/${teamId}`);
    return response.data;
  }
};

export default checklistAssignmentService;