export type OnboardingStage = 'prepare' | 'orient' | 'land' | 'integrate' | 'excel';
export type UserRole = 'employee' | 'supervisor' | 'manager' | 'hr';
export type ProgramType = 'inkompass' | 'earlyTalent' | 'apprenticeship' | 'academicPlacement' | 'workExperience';
export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';

// Backend Model Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  startDate: string;
  programType: ProgramType;
  supervisorId?: string;
  teamId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProgress {
  id: string;
  stage: OnboardingStage;
  progress: number;
  stageStartDate: string;
  estimatedCompletionDate?: string;
  UserId: string;
  User?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  stage: OnboardingStage;
  order: number;
  isDefault: boolean;
  controlledBy?: 'hr' | 'employee' | 'both';
  createdAt: string;
  updatedAt: string;
}

export interface UserTaskProgress {
  id: string;
  UserId: string;
  OnboardingTaskId: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  supervisorNotes?: string;
  OnboardingTask?: OnboardingTask;
  User?: User;
}

export interface ChecklistAssignment {
  id: string;
  checklistId: string;
  userId: string;
  assignedBy: string;
  dueDate?: string;
  status: TaskStatus;
  completionPercentage: number;
  isAutoAssigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistProgress {
  id: string;
  userId: string;
  checklistItemId: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

// Frontend Display Interfaces
export interface OnboardingPhase {
  stage: OnboardingStage;
  title: string;
  description: string;
  tasks: Task[]; // Changed from OnboardingTask[] to Task[]
  userProgress?: UserTaskProgress[];
  completionPercentage: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface OnboardingJourney {
  user: User;
  progress: OnboardingProgress;
  stages?: OnboardingPhase[];
  phases?: OnboardingPhase[];
  overallProgress: number;
  currentStage: OnboardingStage;
  tasksCompleted: number;
  totalTasks: number;
}

export interface EmployeeOnboarding {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  programType: ProgramType;
  currentPhase: OnboardingStage;
  completionPercentage: number;
  status: TaskStatus;
  startDate: string;
  daysSinceStart: number;
  daysSinceLastActivity?: number;
}

// API Response Types
export interface OnboardingProgressResponse {
  id: string;
  stage: OnboardingStage;
  progress: number;
  stageStartDate: string;
  estimatedCompletionDate?: string;
  User: User;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingDashboardData {
  employees: EmployeeOnboarding[];
  statistics: {
    totalEmployees: number;
    activeOnboarding: number;
    completedOnboarding: number;
    overdueEmployees: number;
    averageCompletionTime: number;
  };
  phaseDistribution: {
    prepare: number;
    orient: number;
    land: number;
    integrate: number;
    excel: number;
  };
}

// Add this after the OnboardingTask interface
export interface Task extends OnboardingTask {
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  progressId?: string;
}
