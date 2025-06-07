export type UserRole = 'employee' | 'supervisor' | 'hr' | 'manager';

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

export type ProgramType = 
  | 'inkompass' 
  | 'earlyTalent' 
  | 'apprenticeship' 
  | 'academicPlacement' 
  | 'workExperience';

export type OnboardingStage = 
  | 'prepare' 
  | 'orient' 
  | 'land' 
  | 'integrate' 
  | 'excel';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
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