export type EvaluationStatus = 'pending' | 'in_progress' | 'completed' | 'validated' | 'draft';

export interface EvaluationCriteria {
  id: string;
  evaluationId: string;
  name: string;
  rating: number;
  comments?: string;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  supervisorId: string;
  date: string;
  type: 'field' | 'probation' | 'periodic' | 'training' | '3-month' | '6-month' | '12-month' | 'performance';
  status: EvaluationStatus;
  score?: number;
  feedback?: string;
  criteria: EvaluationCriteria[];
  strengths?: string[];
  areasForImprovement?: string[];
  title?: string; // Added for backend compatibility
  dueDate?: string; // Added for due date functionality
  completedAt?: string; // Added for completion tracking
  employee?: { // Added for employee details
    id: string;
    name: string;
    email: string;
  };
  comments?: string; // Added for general comments
} 