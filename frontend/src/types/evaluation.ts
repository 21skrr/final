export type EvaluationStatus = 'pending' | 'in_progress' | 'completed' | 'validated' | 'draft';

export interface EvaluationCriteria {
  id: string;
  evaluationId: string;
  name: string;
  category?: string;
  criteria?: string;
  rating: number;
  comments?: string;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId?: string;
  supervisorId?: string;
  date?: string;
  dueDate?: string;
  type: '3-month' | '6-month' | '12-month' | 'performance' | 'training' | 'probation' | 'general' | 'field' | 'periodic';
  status: EvaluationStatus;
  score?: number;
  overallScore?: number;
  feedback?: string;
  comments?: string;
  employeeComment?: string;
  criteria: EvaluationCriteria[];
  strengths?: string[];
  areasForImprovement?: string[];
  title?: string;
  completedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  employee?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
    supervisorId?: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email?: string;
  };
}