export type UserRole = 'employee' | 'supervisor' | 'hr' | 'manager' | 'admin';

export type ProgramType = 
  | 'inkompass' 
  | 'earlyTalent' 
  | 'apprenticeship' 
  | 'workExperience';

export type OnboardingStage = 
  | 'prepare' 
  | 'orient' 
  | 'land' 
  | 'integrate' 
  | 'excel';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  startDate?: string;
  programType?: ProgramType;
  supervisorId?: string;
  onboardingStage?: OnboardingStage;
  onboardingProgress?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'info' | 'warning' | 'success' | 'error'
    | 'reminder' | 'document' | 'training' | 'coaching_session'
    | 'team_progress' | 'overdue_task' | 'feedback_availability'
    | 'feedback_submission' | 'weekly_report' | 'compliance'
    | 'leave_request' | 'evaluation_reminder' | 'evaluation_overdue'
    | 'task' | 'event' | 'evaluation' | 'feedback' | 'system'
    | 'team_followup' | 'probation_deadline' | 'system_alert'
    | 'new_employee' | 'compliance_alert' | 'feedback_available'
    | 'assessment_pending'
    | string; // fallback for any future types
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
  link?: string;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  supervisorId: string;
  date: string;
  type: 'field' | 'probation' | 'periodic' | 'training';
  status: 'pending' | 'completed';
  score?: number;
  feedback?: string;
  skills: Record<string, number>;
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  deadline: string;
  questions: SurveyQuestion[];
  status: 'draft' | 'active' | 'completed';
  responsesCount: number;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'rating' | 'text';
  options?: string[];
  required: boolean;
}