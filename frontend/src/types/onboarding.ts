export type OnboardingStage =
  | "pre_onboarding"
  | "phase_1"
  | "phase_2";

export type JourneyType = "SFP" | "CC";

export type UserRole = "employee" | "supervisor" | "manager" | "hr";
export type ProgramType =
  | "inkompass"
  | "earlyTalent"
  | "apprenticeship"
  | "academicPlacement"
  | "workExperience";
export type TaskStatus = "assigned" | "in_progress" | "completed" | "overdue";

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
  overall?: number;
  status?: "pending" | "in_progress" | "completed" | "overdue";
  teamId?: number;
  assessmentPdfUrl?: string;
  assessmentAnswers?: string;
  assessmentStatus?: "pending" | "approved" | "rejected";
  assessmentReviewNotes?: string;
  orientProgress?: number;
  landProgress?: number;
  integrateProgress?: number;
  excelProgress?: number;
  orientStatus?: "pending" | "in_progress" | "completed" | "on_hold" | "approved";
  landStatus?: "pending" | "in_progress" | "completed" | "on_hold" | "approved";
  integrateStatus?: "pending" | "in_progress" | "completed" | "on_hold" | "approved";
  excelStatus?: "pending" | "in_progress" | "completed" | "on_hold" | "approved";
  certificateFile?: string;
  journeyType: JourneyType;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  stage: OnboardingStage;
  order: number;
  isDefault: boolean;
  controlledBy?: "hr" | "employee" | "both";
  hrValidated?: boolean;
  completed?: boolean;
  journeyType: JourneyType | "both";
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
  journeyType: JourneyType;
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
  journeyType: JourneyType;
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
  journeyType: JourneyType;
  supervisorAssessment?: {
    id: string;
    status: string;
    supervisorDecision?: string;
    supervisorComments?: string;
    hrDecision?: string;
    hrDecisionComments?: string;
    hrDecisionDate?: string;
    employee?: {
      id: string;
      name: string;
      email: string;
      department: string;
    };
    supervisor?: {
      id: string;
      name: string;
      email: string;
    };
    hrValidator?: {
      id: string;
      name: string;
      email: string;
    };
  };
  hrAssessment?: {
    id: string;
    status: string;
    hrDecision?: string;
    hrDecisionComments?: string;
    hrDecisionDate?: string;
    employee?: {
      id: string;
      name: string;
      email: string;
      department: string;
    };
    hr?: {
      id: string;
      name: string;
      email: string;
    };
  };
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
    pre_onboarding: number;
    phase_1: number;
    phase_2: number;
  };
  journeyTypeDistribution: {
    SFP: number;
    CC: number;
  };
}

// Add this after the OnboardingTask interface
export interface Task extends OnboardingTask {
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  dueDate?: string;
  evidenceRequired?: boolean;
  evidenceUrl?: string;
  evidenceDescription?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  progressId?: string;
  User?: User; // For user details who completed the task
}

export interface JourneyTypeOption {
  value: JourneyType;
  label: string;
}
