export type EvaluationStatus = 'pending' | 'in_progress' | 'completed' | 'validated';

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
  type: 'field' | 'probation' | 'periodic' | 'training';
  status: EvaluationStatus;
  score?: number;
  feedback?: string;
  criteria: EvaluationCriteria[];
  strengths?: string[];
  areasForImprovement?: string[];
} 