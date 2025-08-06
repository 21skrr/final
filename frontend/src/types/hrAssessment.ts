// types/hrAssessment.ts

export type HRAssessmentStatus = 
  | "pending_assessment" 
  | "assessment_completed" 
  | "decision_pending" 
  | "decision_made" 
  | "completed";

export type HRDecision = "approve" | "reject" | "request_changes";

export interface HRAssessment {
  id: string;
  OnboardingProgressId: string;
  UserId: string;
  HRId: string;
  assessmentDate?: string;
  assessmentNotes?: string;
  assessmentScore?: number;
  hrDecision?: HRDecision;
  hrDecisionComments?: string;
  hrDecisionDate?: string;
  status: HRAssessmentStatus;
  phase2CompletedDate?: string;
  assessmentRequestedDate?: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface HRAssessmentListResponse {
  assessments: HRAssessment[];
}

export interface HRAssessmentResponse {
  assessment: HRAssessment;
}

export interface ConductAssessmentFormData {
  assessmentNotes: string;
  assessmentScore?: number;
}

export interface MakeDecisionFormData {
  hrDecision: HRDecision;
  hrDecisionComments: string;
}

export interface ConductAssessmentResponse {
  message: string;
  assessment: HRAssessment;
}

export interface MakeDecisionResponse {
  message: string;
  assessment: HRAssessment;
} 